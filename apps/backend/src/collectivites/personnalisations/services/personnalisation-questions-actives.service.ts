import { Injectable, Logger } from '@nestjs/common';
import type { ListPersonnalisationQuestionsFilters } from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.input';
import { ListPersonnalisationQuestionsRepository } from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.repository';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import {
  CollectiviteType,
  IdentiteCollectivite,
  PersonnalisationReponsesPayload,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import {
  ReferentielId,
  referentielIdEnumValues,
} from '@tet/domain/referentiels';
import { isNil, uniqBy } from 'es-toolkit';
import { computeMaskedQuestionIds } from './personnalisation-questions-actives.rules';
import PersonnalisationsExpressionService from './personnalisations-expression.service';

export type ResolveActiveQuestionsInput = {
  enabledReferentiels: ReferentielId[];
  filters: ListPersonnalisationQuestionsFilters;
  reponses: PersonnalisationReponsesPayload;
  collectiviteId: number;
};

export type ResolveActiveQuestionsResult = {
  questions: QuestionWithChoices[];
  reponsesQuestionsActives: PersonnalisationReponsesPayload;
};

/**
 * Détermine les questions de personnalisation actives pour une collectivité.
 *
 * Une question active est prise en compte pour l'affichage mais aussi pour l'
 * évaluation des conséquences et le calcul des scores. Elle est exclue si le
 * type de la collectivité ne correspond pas à ceux du champ
 * `typesCollectivitesConcernees` quand il est spécifié, ou si le champ
 * `exprVisible` est évalué à faux à partir des réponses fournies, en ignorant
 * les réponses des questions elles-mêmes masquées (masquage en cascade).
 */
@Injectable()
export class PersonnalisationQuestionsActivesService {
  private readonly logger = new Logger(
    PersonnalisationQuestionsActivesService.name
  );

  constructor(
    private readonly listPersonnalisationQuestionsRepository: ListPersonnalisationQuestionsRepository,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  filterReponsesForActiveQuestionIds(
    reponses: PersonnalisationReponsesPayload,
    questionIds: readonly string[]
  ): PersonnalisationReponsesPayload {
    const activeIds = new Set(questionIds);
    return Object.fromEntries(
      Object.entries(reponses).filter(([questionId]) =>
        activeIds.has(questionId)
      )
    );
  }

  /**
   * Résout les questions actives pour une collectivité et le payload de
   * réponses à utiliser pour l'évaluation des conséquences.
   */
  async resolveActiveQuestions(
    input: ResolveActiveQuestionsInput
  ): Promise<ResolveActiveQuestionsResult> {
    const { enabledReferentiels, filters, reponses, collectiviteId } = input;

    const identiteCollectivite =
      await this.collectivitesService.getCollectiviteAvecType(collectiviteId);

    const questions =
      await this.listPersonnalisationQuestionsRepository.listQuestionsWithChoices(
        enabledReferentiels,
        { ...filters, collectiviteId }
      );

    const allQuestions = this.isListingComplete(enabledReferentiels, filters)
      ? questions
      : uniqBy(
          [
            ...questions,
            ...(await this.listPersonnalisationQuestionsRepository.listQuestionsWithChoices(
              [...referentielIdEnumValues]
            )),
          ],
          (question) => question.id
        );

    const maskedQuestionIds = this.computeMaskedQuestionIds(
      allQuestions,
      reponses,
      identiteCollectivite
    );

    const activeQuestions = questions.filter(
      (question) => !maskedQuestionIds.has(question.id)
    );

    // filtre les réponses pour ne conserver que celles des questions actives
    const reponsesQuestionsActives = this.filterReponsesForActiveQuestionIds(
      reponses,
      activeQuestions.map((question) => question.id)
    );

    return { questions: activeQuestions, reponsesQuestionsActives };
  }

  /**
   * Indique si la liste filtrée contient déjà toutes les questions (aucun
   * filtre d'affichage, tous les référentiels) : inutile alors de recharger
   * le graphe complet pour calculer le masquage.
   */
  private isListingComplete(
    enabledReferentiels: ReferentielId[],
    filters: ListPersonnalisationQuestionsFilters
  ): boolean {
    const { actionIds, questionIds, thematiqueIds, referentielIds } = filters;
    if (actionIds?.length || questionIds?.length || thematiqueIds?.length) {
      return false;
    }
    const referentiels = referentielIds?.length
      ? enabledReferentiels.filter((id) => referentielIds.includes(id))
      : enabledReferentiels;
    return referentielIdEnumValues.every((id) => referentiels.includes(id));
  }

  /**
   * Le masquage se calcule sur toutes les questions, indépendamment des
   * filtres d'affichage et des référentiels demandés : une question parente
   * hors du périmètre demandé doit quand même être prise en compte pour ses
   * questions enfants (ex. `dev_eco_2`, liée au CAE, dépend de `dev_eco_1`,
   * liée à ECI et TE).
   */
  private computeMaskedQuestionIds(
    allQuestions: QuestionWithChoices[],
    reponses: PersonnalisationReponsesPayload,
    identiteCollectivite: IdentiteCollectivite
  ): Set<string> {
    const collectiviteType: CollectiviteType =
      identiteCollectivite.type === 'EPCI' ? 'epci' : identiteCollectivite.type;

    return computeMaskedQuestionIds({
      questions: allQuestions.map((question) => ({
        id: question.id,
        exprVisible: question.exprVisible,
        isApplicable: this.isQuestionApplicableToCollectivite(
          question,
          collectiviteType
        ),
      })),
      reponses,
      getDependencies: (exprVisible) => this.getDependencies(exprVisible),
      isVisible: (exprVisible, reponsesEffectives) =>
        this.isQuestionActiveByExprVisible(
          exprVisible,
          reponsesEffectives,
          identiteCollectivite
        ),
      onCycle: (questionId) =>
        this.logger.warn(
          `Dépendance circulaire dans exprVisible, question exclue : ${questionId}`
        ),
    });
  }

  private getDependencies(exprVisible: string): string[] {
    try {
      return Object.keys(
        this.personnalisationsExpressionService.extractNeededQuestionsFromExpression(
          exprVisible
        )
      );
    } catch {
      // l'expression invalide sera exclue (et loguée) lors de son évaluation
      return [];
    }
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

  private isQuestionActiveByExprVisible(
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
          { reponses, identiteCollectivite: identite }
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
}
