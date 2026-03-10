import { Injectable, Logger } from '@nestjs/common';
import { ListPersonnalisationReponsesService } from '@tet/backend/collectivites/personnalisations/list-personnalisation-reponses/list-personnalisation-reponses.service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import {
  CollectiviteType,
  IdentiteCollectivite,
  PersonnalisationQuestionReponse,
  PersonnalisationReponsesPayload,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import {
  ActionType,
  getParentIdFromActionId,
  getReferentielIdFromActionId,
  ReferentielException,
  ReferentielId,
  rollUpActionIdToActionLevel,
} from '@tet/domain/referentiels';
import { isNil } from 'es-toolkit';
import { CollectivitePreferencesService } from '../../collectivite-preferences/collectivite-preferences.service';
import { PersonnalisationConsequencesByActionId } from '../models/personnalisation-consequence.dto';
import { PersonnalisationConsequencesService } from '../services/personnalisation-consequences.service';
import PersonnalisationsExpressionService from '../services/personnalisations-expression.service';
import PersonnalisationsService from '../services/personnalisations-service';
import type {
  ListPersonnalisationQuestionsFilters,
  ListPersonnalisationQuestionsInput,
} from './list-personnalisation-questions.input';
import { ListPersonnalisationQuestionsError } from './list-personnalisation-questions.errors';
import { ListPersonnalisationQuestionsRepository } from './list-personnalisation-questions.repository';

@Injectable()
export default class ListPersonnalisationQuestionsService {
  private readonly logger = new Logger(
    ListPersonnalisationQuestionsService.name
  );

  constructor(
    private readonly listPersonnalisationQuestionsRepository: ListPersonnalisationQuestionsRepository,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly collectivitesService: CollectivitesService,
    private readonly collectivitePreferencesService: CollectivitePreferencesService,
    private readonly listPersonnalisationReponsesService: ListPersonnalisationReponsesService,
    private readonly trackingService: TrackingService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService,
    private readonly personnalisationConsequencesService: PersonnalisationConsequencesService
  ) {}

  /**
   * Questions visibles pour la collectivité avec leurs réponses (y compris réponses « vides »).
   */
  async listQuestionsReponses(
    input: ListPersonnalisationQuestionsInput,
    user: AuthenticatedUser
  ): Promise<
    Result<
      PersonnalisationQuestionReponse[],
      ListPersonnalisationQuestionsError
    >
  > {
    const isReferentielTEEnabled = await this.trackingService.isFeatureEnabled(
      'is-referentiel-te-enabled',
      user.id
    );

    const enabledReferentiels =
      await this.collectivitePreferencesService.getEnabledReferentiels(
        isReferentielTEEnabled,
        input.collectiviteId,
        user
      );

    const questions = await this.getVisibleQuestionsForCollectivite(
      input,
      enabledReferentiels
    );
    if (questions.length === 0) {
      return success([]);
    }

    const ids = questions.map((q) => q.id);
    const reponsesResult =
      await this.listPersonnalisationReponsesService.listPersonnalisationReponses(
        {
          collectiviteId: input.collectiviteId,
          questionIds: ids,
        },
        user
      );
    if (!reponsesResult.success) {
      return failure(reponsesResult.error);
    }

    const reponses = reponsesResult.data;
    const byQuestionId = new Map(
      reponses.map((r) => [r.questionId, r] as const)
    );
    return success(
      questions.map((question) => ({
        question,
        reponse: byQuestionId.get(question.id) ?? null,
      }))
    );
  }

  /**
   * Liste toutes les questions de personnalisation
   */
  async listQuestionsWithChoices(
    enabledReferentiels: ReferentielId[],
    input?: ListPersonnalisationQuestionsFilters
  ): Promise<QuestionWithChoices[]> {
    const filters = input ?? {};
    return this.listPersonnalisationQuestionsRepository.listQuestionsWithChoices(
      enabledReferentiels,
      filters
    );
  }

  private isQuestionApplicableToCollectivite(
    question: QuestionWithChoices,
    collectiviteType: CollectiviteType
  ): boolean {
    return (
      isNil(question.typesCollectivitesConcernees) ||
      question.typesCollectivitesConcernees.includes(collectiviteType)
    );
  }

  /**
   * Liste les questions visibles pour une collectivité donnée et après
   * application des filtres et évaluation des conséquences des réponses
   */
  private async getVisibleQuestionsForCollectivite(
    input: ListPersonnalisationQuestionsFilters,
    enabledReferentiels: ReferentielId[]
  ): Promise<QuestionWithChoices[]> {
    this.logger.log(
      `Fetching personnalisation questions with choices${
        input && Object.keys(input).length
          ? ` and filtered by: ${JSON.stringify(input)}`
          : ''
      }`
    );

    const { collectiviteId } = input;
    const questions = await this.listQuestionsWithChoices(
      enabledReferentiels,
      input
    );
    // collectivité non spécifiée => renvoie uniquement les questions
    if (collectiviteId === undefined) {
      return questions;
    }

    const [reponses, identiteCollectivite] = await Promise.all([
      this.personnalisationsService.getPersonnalisationReponses(collectiviteId),
      this.collectivitesService.getCollectiviteAvecType(collectiviteId),
    ]);

    const filteredQuestions = questions.filter(
      (question) =>
        this.isQuestionApplicableToCollectivite(
          question,
          identiteCollectivite.type === 'EPCI'
            ? 'epci'
            : identiteCollectivite.type
        ) &&
        this.isQuestionIncludedByExprVisible(
          question.exprVisible,
          reponses,
          identiteCollectivite
        )
    );

    const questionIds = filteredQuestions.map((question) => question.id);
    const filteredReponses = Object.fromEntries(
      Object.entries(reponses).filter(([questionId]) =>
        questionIds.includes(questionId)
      )
    );

    const { consequences } =
      await this.personnalisationConsequencesService.getPersonnalisationConsequencesForCollectivite(
        collectiviteId,
        {},
        undefined,
        identiteCollectivite,
        { reponsesDejaChargees: filteredReponses }
      );

    const hierarchiesByReferentielId =
      await this.getReferentielDefinitionService.getHierarchiesByReferentielIds(
        enabledReferentiels
      );

    const questionsWithTransformedActionIds = filteredQuestions.map((q) => ({
      ...q,
      actionIds: this.transformActionIds(
        q.actionIds,
        consequences,
        hierarchiesByReferentielId
      ),
    }));

    this.logger.log(
      `Successfully fetched ${questionsWithTransformedActionIds.length} questions`
    );

    return questionsWithTransformedActionIds;
  }

  private isQuestionIncludedByExprVisible(
    exprVisible: string | null | undefined,
    reponses: PersonnalisationReponsesPayload,
    identite: IdentiteCollectivite
  ): boolean {
    if (isNil(exprVisible)) {
      return true;
    }
    const trimmed = exprVisible.trim();
    if (trimmed === '') {
      return true;
    }
    try {
      const result =
        this.personnalisationsExpressionService.parseAndEvaluateExpression(
          trimmed,
          reponses,
          identite,
          null
        );
      return result === true;
    } catch (err) {
      this.logger.warn(
        `Évaluation exprVisible impossible, question exclue : ${trimmed}`,
        err
      );
      return false;
    }
  }

  private isActionIdDisabledByPersonnalisationAncestors(
    actionId: string,
    consequences: PersonnalisationConsequencesByActionId
  ): boolean {
    let current: string | null = actionId;
    while (current !== null) {
      if (consequences[current]?.desactive) {
        return true;
      }
      current = getParentIdFromActionId(current);
    }
    return false;
  }

  private transformActionIds(
    actionIds: string[] | null | undefined,
    consequences: PersonnalisationConsequencesByActionId,
    hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>
  ) {
    const filteredActionIds =
      this.filterActionIdsByPersonnalisationConsequences(
        actionIds,
        consequences
      );
    return this.rollUpQuestionActionIds(
      filteredActionIds,
      hierarchiesByReferentielId
    );
  }

  private filterActionIdsByPersonnalisationConsequences(
    actionIds: string[] | null | undefined,
    consequences: PersonnalisationConsequencesByActionId
  ): string[] | null | undefined {
    if (actionIds == null || actionIds.length === 0) {
      return actionIds;
    }
    const filtered = actionIds.filter(
      (id) =>
        !this.isActionIdDisabledByPersonnalisationAncestors(id, consequences)
    );
    if (filtered.length === actionIds.length) {
      return actionIds;
    }
    return [...new Set(filtered)].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }

  private rollUpQuestionActionIds(
    actionIds: string[] | null | undefined,
    hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>
  ): string[] | null | undefined {
    if (actionIds == null || actionIds.length === 0) {
      return actionIds;
    }

    const roll = (actionId: string): string => {
      try {
        const referentielId = getReferentielIdFromActionId(actionId);
        const hierarchie = hierarchiesByReferentielId.get(referentielId);
        if (!hierarchie) {
          return actionId;
        }
        return rollUpActionIdToActionLevel(actionId, hierarchie);
      } catch (err) {
        if (err instanceof ReferentielException) {
          this.logger.warn(
            `Roll-up vers le niveau mesure ignoré pour l'actionId « ${actionId} » (données référentiel ou lien question-action incohérent).`,
            err
          );
          return actionId;
        }
        throw err;
      }
    };

    const rolled = actionIds.map(roll);
    return [...new Set(rolled)].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }
}
