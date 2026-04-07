import { Injectable, Logger } from '@nestjs/common';
import { ListPersonnalisationReponsesService } from '@tet/backend/collectivites/personnalisations/list-personnalisation-reponses/list-personnalisation-reponses.service';
import { questionChoixTable } from '@tet/backend/collectivites/personnalisations/models/question-choix.table';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  CollectiviteType,
  IdentiteCollectivite,
  PersonnalisationReponse,
  PersonnalisationReponsesPayload,
  QuestionChoix,
  QuestionReponse,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { and, eq, exists, inArray, isNull, or, SQL, sql } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import PersonnalisationsExpressionService from '../services/personnalisations-expression.service';
import PersonnalisationsService from '../services/personnalisations-service';
import type {
  ListPersonnalisationQuestionsFilters,
  ListPersonnalisationQuestionsInput,
} from './list-personnalisation-questions.input';

const unwrapListReponsesResult = createTrpcErrorHandler();

@Injectable()
export default class ListPersonnalisationQuestionsService {
  private readonly logger = new Logger(
    ListPersonnalisationQuestionsService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly collectivitesService: CollectivitesService,
    private readonly listPersonnalisationReponsesService: ListPersonnalisationReponsesService
  ) {}

  /**
   * Fourni, selon le mode, questions seules, questions + réponses, ou réponses seules
   */
  async listPersonnalisation(
    input: ListPersonnalisationQuestionsInput,
    user: AuthenticatedUser
  ): Promise<
    QuestionWithChoices[] | QuestionReponse[] | PersonnalisationReponse[]
  > {
    if (input.mode === 'questions' || !input.collectiviteId) {
      return this.getVisibleQuestionsWithChoices(input);
    }

    if (input.mode === 'withReponses') {
      const questions = await this.getVisibleQuestionsWithChoices(input);
      const ids = questions.map((q) => q.id);
      if (ids.length === 0) {
        return [];
      }
      const reponsesResult =
        await this.listPersonnalisationReponsesService.listPersonnalisationReponses(
          {
            collectiviteId: input.collectiviteId,
            questionIds: ids,
            withEmptyReponse: input.withEmptyReponse,
          },
          user
        );
      const reponses = unwrapListReponsesResult(reponsesResult);
      const byQuestionId = new Map(
        reponses.map((r) => [r.questionId, r] as const)
      );
      return questions.map((question) => ({
        question,
        reponse: byQuestionId.get(question.id) ?? null,
      }));
    }

    // mode 'reponsesOnly'
    const ids = await this.getVisibleQuestionIds(input);
    if (ids.length === 0) {
      return [];
    }
    const reponsesResult =
      await this.listPersonnalisationReponsesService.listPersonnalisationReponses(
        {
          collectiviteId: input.collectiviteId,
          questionIds: ids,
          withEmptyReponse: input.withEmptyReponse,
        },
        user
      );
    return unwrapListReponsesResult(reponsesResult);
  }

  /**
   * Creates a subquery that aggregates choices per question
   */
  private getQuestionChoixQuery() {
    const query = this.databaseService.db
      .select({
        questionId: questionChoixTable.questionId,
        choix: sql<Omit<QuestionChoix, 'questionId' | 'version'>[]>`
          array_agg(
            json_build_object(
              'id', ${questionChoixTable.id},
              'ordonnancement', ${questionChoixTable.ordonnancement},
              'formulation', ${questionChoixTable.formulation}
            )
            ORDER BY ${questionChoixTable.ordonnancement}, ${questionChoixTable.id}
          )
        `.as('choix'),
      })
      .from(questionChoixTable)
      .groupBy(questionChoixTable.questionId);

    return query.as('questionChoix');
  }

  /**
   * Lists all personnalisation questions with their choices (filtres + expr_visible).
   */
  async listQuestionsWithChoices(
    input?: ListPersonnalisationQuestionsFilters
  ): Promise<QuestionWithChoices[]> {
    return this.getVisibleQuestionsWithChoices(input ?? {});
  }

  /**
   * Ids des questions visibles (filtres SQL + expr_visible), sans chargement des choix ni colonnes de définition.
   * Utilisé pour le mode `reponsesOnly`.
   */
  private async getVisibleQuestionIds(
    input: ListPersonnalisationQuestionsFilters
  ): Promise<string[]> {
    const conditions =
      this.buildPersonnalisationQuestionFilterConditions(input);
    const { collectiviteId } = input;

    let baseQuery = this.databaseService.db
      .select({
        id: questionTable.id,
        exprVisible: questionTable.exprVisible,
      })
      .from(questionTable);

    if (collectiviteId !== undefined) {
      baseQuery = baseQuery.innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, collectiviteId)
      ) as unknown as typeof baseQuery;
    }

    const queryWithConditions =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    let rows = await queryWithConditions.orderBy(
      questionTable.ordonnancement,
      questionTable.id
    );

    if (collectiviteId !== undefined) {
      const [reponses, identiteCollectivite] = await Promise.all([
        this.personnalisationsService.getPersonnalisationReponses(
          collectiviteId
        ),
        this.collectivitesService.getCollectiviteAvecType(collectiviteId),
      ]);
      rows = rows.filter((row) =>
        this.isQuestionIncludedByExprVisible(
          row.exprVisible,
          reponses,
          identiteCollectivite
        )
      );
    }

    return rows.map((r) => r.id);
  }

  private buildPersonnalisationQuestionFilterConditions(
    input: ListPersonnalisationQuestionsFilters
  ): (ReturnType<typeof eq> | SQL)[] {
    const {
      actionIds,
      collectiviteId,
      questionIds,
      referentielIds,
      thematiqueIds,
    } = input;
    const conditions: (ReturnType<typeof eq> | SQL)[] = [];

    if (actionIds && actionIds.length > 0) {
      const actionIdsFilterQuery = this.databaseService.db
        .select({ questionId: questionActionTable.questionId })
        .from(questionActionTable)
        .where(
          and(
            eq(questionActionTable.questionId, questionTable.id),
            inArray(questionActionTable.actionId, actionIds)
          )
        );
      conditions.push(exists(actionIdsFilterQuery));
    }

    if (referentielIds && referentielIds.length > 0) {
      const referentielOverlapQuery = this.databaseService.db
        .select({ questionId: questionActionTable.questionId })
        .from(questionActionTable)
        .innerJoin(
          actionRelationTable,
          eq(questionActionTable.actionId, actionRelationTable.id)
        )
        .where(
          and(
            eq(questionActionTable.questionId, questionTable.id),
            inArray(actionRelationTable.referentiel, referentielIds)
          )
        );
      conditions.push(exists(referentielOverlapQuery));
    }

    if (thematiqueIds && thematiqueIds.length > 0) {
      conditions.push(inArray(questionTable.thematiqueId, thematiqueIds));
    }
    if (questionIds && questionIds.length > 0) {
      conditions.push(inArray(questionTable.id, questionIds));
    }

    if (collectiviteId !== undefined) {
      conditions.push(
        or(
          isNull(questionTable.typesCollectivitesConcernees),
          sql`${questionTable.typesCollectivitesConcernees} @> ARRAY[${collectiviteTable.type}]::text[]`
        ) as SQL
      );
    }

    return conditions;
  }

  /**
   * Questions visibles après filtres métier et expr_visible.
   */
  private async getVisibleQuestionsWithChoices(
    input: ListPersonnalisationQuestionsFilters
  ): Promise<QuestionWithChoices[]> {
    this.logger.log(
      `Fetching personnalisation questions with choices${
        input && Object.keys(input).length
          ? ` and filtered by: ${JSON.stringify(input)}`
          : ''
      }`
    );

    const questionChoixSubquery = this.getQuestionChoixQuery();
    const actionsSubquery = this.getActionsSubquery();
    const { collectiviteId } = input;
    const conditions =
      this.buildPersonnalisationQuestionFilterConditions(input);

    let baseQuery = this.databaseService.db
      .select({
        id: questionTable.id,
        actionIds: actionsSubquery.actionIds,
        referentielIds: actionsSubquery.referentielIds,
        thematiqueId: questionTable.thematiqueId,
        thematiqueNom: questionThematiqueTable.nom,
        ordonnancement: questionTable.ordonnancement,
        typesCollectivitesConcernees: sql<
          CollectiviteType[] | null | undefined
        >`${questionTable.typesCollectivitesConcernees}`,
        type: questionTable.type,
        description: questionTable.description,
        formulation: questionTable.formulation,
        version: questionTable.version,
        choix: sql<
          Omit<QuestionChoix, 'questionId' | 'version'>[]
        >`${questionChoixSubquery.choix}`,
        competenceCode: questionTable.competenceCode,
        consignesJustification: questionTable.consignesJustification,
        exprVisible: questionTable.exprVisible,
      })
      .from(questionTable)
      .leftJoin(
        questionChoixSubquery,
        eq(questionChoixSubquery.questionId, questionTable.id)
      )
      .leftJoin(
        questionThematiqueTable,
        eq(questionThematiqueTable.id, questionTable.thematiqueId)
      )
      .leftJoin(
        actionsSubquery,
        eq(actionsSubquery.questionId, questionTable.id)
      );

    if (collectiviteId !== undefined) {
      baseQuery = baseQuery.innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, collectiviteId)
      ) as unknown as typeof baseQuery;
    }

    const queryWithConditions =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    let questions = await queryWithConditions.orderBy(
      questionTable.ordonnancement,
      questionTable.id
    );

    if (collectiviteId !== undefined) {
      const [reponses, identiteCollectivite] = await Promise.all([
        this.personnalisationsService.getPersonnalisationReponses(
          collectiviteId
        ),
        this.collectivitesService.getCollectiviteAvecType(collectiviteId),
      ]);
      questions = questions.filter((q) =>
        this.isQuestionIncludedByExprVisible(
          q.exprVisible,
          reponses,
          identiteCollectivite
        )
      );
    }

    this.logger.log(`Successfully fetched ${questions.length} questions`);

    return questions;
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

  private getActionsSubquery() {
    return this.databaseService.db
      .select({
        questionId: questionActionTable.questionId,
        actionIds: sql<string[]>`array_agg(
            distinct ${questionActionTable.actionId}
            order by ${questionActionTable.actionId}
          )::text[]`.as('action_ids'),
        referentielIds: sql<string[]>`array_agg(
            distinct ${actionRelationTable.referentiel}
            order by ${actionRelationTable.referentiel}
          )::text[]`.as('referentiel_ids'),
      })
      .from(questionActionTable)
      .leftJoin(
        actionRelationTable,
        eq(questionActionTable.actionId, actionRelationTable.id)
      )
      .groupBy(questionActionTable.questionId)
      .as('actions');
  }
}
