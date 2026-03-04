import { Injectable, Logger } from '@nestjs/common';
import { ListPersonnalisationReponsesService } from '@tet/backend/collectivites/personnalisations/list-personnalisation-reponses/list-personnalisation-reponses.service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import {
  PersonnalisationQuestionReponse,
  PersonnalisationReponsesPayload,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import {
  ActionType,
  getParentId,
  getReferentielIdFromActionId,
  ReferentielException,
  ReferentielId,
  rollUpActionIdToActionLevel,
} from '@tet/domain/referentiels';
import { CollectivitePreferencesService } from '../../collectivite-preferences/collectivite-preferences.service';
import { PersonnalisationConsequencesByActionId } from '../models/personnalisation-consequence.dto';
import { PersonnalisationConsequencesService } from '../services/personnalisation-consequences.service';
import { PersonnalisationQuestionsActivesService } from '../services/personnalisation-questions-actives.service';
import PersonnalisationsService from '../services/personnalisations-service';
import { ListPersonnalisationQuestionsError } from './list-personnalisation-questions.errors';
import type {
  ListPersonnalisationQuestionsFilters,
  ListPersonnalisationQuestionsInput,
} from './list-personnalisation-questions.input';
import { ListPersonnalisationQuestionsRepository } from './list-personnalisation-questions.repository';

type ActiveQuestionsForCollectiviteResult = {
  questions: QuestionWithChoices[];
  reponsesQuestionsActives: PersonnalisationReponsesPayload;
};

@Injectable()
export default class ListPersonnalisationQuestionsService {
  private readonly logger = new Logger(
    ListPersonnalisationQuestionsService.name
  );

  constructor(
    private readonly listPersonnalisationQuestionsRepository: ListPersonnalisationQuestionsRepository,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly collectivitePreferencesService: CollectivitePreferencesService,
    private readonly listPersonnalisationReponsesService: ListPersonnalisationReponsesService,
    private readonly trackingService: TrackingService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService,
    private readonly personnalisationConsequencesService: PersonnalisationConsequencesService,
    private readonly personnalisationQuestionsActivesService: PersonnalisationQuestionsActivesService,
    private readonly collectivitesService: CollectivitesService,
    private readonly databaseService: DatabaseService
  ) {}

  /**
   * Questions actives pour la collectivité avec leurs réponses (y compris réponses « vides »).
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
      user.id,
      input.collectiviteId
    );

    const enabledReferentiels =
      await this.collectivitePreferencesService.getEnabledReferentiels(
        isReferentielTEEnabled,
        input.collectiviteId,
        user
      );

    return this.databaseService.db.transaction(async (tx) => {
      const reponsesCompletes =
        await this.personnalisationsService.getPersonnalisationReponses(
          input.collectiviteId,
          undefined,
          undefined,
          tx
        );

      const { questions, reponsesQuestionsActives } =
        await this.resolveActiveQuestionsForCollectivite(
          input,
          enabledReferentiels,
          reponsesCompletes
        );
      this.logger.log(
        `Found ${questions.length} questions for collectivite ${
          input.collectiviteId
        } and enabledreferentiels ${enabledReferentiels.join(
          ', '
        )} and input ${JSON.stringify(input)}`
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
            reponsesEffectives: reponsesQuestionsActives,
          },
          user,
          tx
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
    });
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

  /**
   * Liste les questions actives pour une collectivité donnée et après
   * application des filtres et évaluation des conséquences des réponses
   */
  private async resolveActiveQuestionsForCollectivite(
    input: ListPersonnalisationQuestionsFilters,
    enabledReferentiels: ReferentielId[],
    reponsesCompletes?: PersonnalisationReponsesPayload
  ): Promise<ActiveQuestionsForCollectiviteResult> {
    this.logger.log(
      `Fetching personnalisation questions with choices${
        input && Object.keys(input).length
          ? ` and filtered by: ${JSON.stringify(input)}`
          : ''
      }`
    );

    const { collectiviteId } = input;
    if (collectiviteId === undefined) {
      const questions = await this.listQuestionsWithChoices(
        enabledReferentiels,
        input
      );
      return { questions, reponsesQuestionsActives: {} };
    }

    const reponses =
      reponsesCompletes ??
      (await this.personnalisationsService.getPersonnalisationReponses(
        collectiviteId
      ));

    const { questions: activeQuestions, reponsesQuestionsActives } =
      await this.personnalisationQuestionsActivesService.resolveActiveQuestions(
        {
          enabledReferentiels,
          filters: input,
          reponses,
          collectiviteId,
        }
      );

    const identiteCollectivite =
      await this.collectivitesService.getCollectiviteAvecType(collectiviteId);

    const regles =
      await this.personnalisationConsequencesService.getPersonnalisationRegles(
        input.referentielIds?.length === 1 ? input.referentielIds[0] : undefined
      );
    const consequences =
      await this.personnalisationConsequencesService.getPersonnalisationConsequences(
        regles,
        reponsesQuestionsActives,
        identiteCollectivite
      );

    const hierarchiesByReferentielId =
      await this.getReferentielDefinitionService.getHierarchiesByReferentielIds(
        enabledReferentiels
      );

    const questions = activeQuestions.map((q) => ({
      ...q,
      actionIds: this.transformActionIds(
        q.actionIds,
        consequences,
        hierarchiesByReferentielId
      ),
    }));

    this.logger.log(`Successfully fetched ${questions.length} questions`);

    return { questions, reponsesQuestionsActives };
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
      current = getParentId({ actionId: current });
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
