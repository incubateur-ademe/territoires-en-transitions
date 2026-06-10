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
import { ReferentielId } from '@tet/domain/referentiels';
import { isNil } from 'es-toolkit';
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
 * `exprVisible` est évalué à faux à partir des réponses fournies.
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

    const questions =
      await this.listPersonnalisationQuestionsRepository.listQuestionsWithChoices(
        enabledReferentiels,
        { ...filters, collectiviteId }
      );

    const identiteCollectivite =
      await this.collectivitesService.getCollectiviteAvecType(collectiviteId);

    const activeQuestions = questions.filter(
      (question) =>
        this.isQuestionApplicableToCollectivite(
          question,
          identiteCollectivite.type === 'EPCI'
            ? 'epci'
            : identiteCollectivite.type
        ) &&
        this.isQuestionActiveByExprVisible(
          question.exprVisible,
          reponses,
          identiteCollectivite
        )
    );

    // filtre les réponses pour ne conserver que celles des questions actives
    const reponsesQuestionsActives = this.filterReponsesForActiveQuestionIds(
      reponses,
      activeQuestions.map((question) => question.id)
    );

    return { questions: activeQuestions, reponsesQuestionsActives };
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
