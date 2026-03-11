import { Injectable, Logger } from '@nestjs/common';
import { questionChoixTable } from '@tet/backend/collectivites/personnalisations/models/question-choix.table';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { arrayOverlapsPatched } from '@tet/backend/utils/drizzle.utils';
import {
  CollectiviteType,
  QuestionChoix,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { and, eq, inArray, isNull, or, SQL, sql } from 'drizzle-orm';
import { ListPersonnalisationQuestionsInput } from './list-personnalisation-questions.input';

@Injectable()
export default class ListPersonnalisationQuestionsService {
  private readonly logger = new Logger(
    ListPersonnalisationQuestionsService.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

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
   * Lists all personnalisation questions with their choices
   * @returns Array of questions with their choices attached
   */
  async listQuestionsWithChoices(
    input?: ListPersonnalisationQuestionsInput
  ): Promise<QuestionWithChoices[]> {
    this.logger.log(
      `Fetching all personnalisation questions with choices${
        input ? ` and filtered by: ${JSON.stringify(input)}` : ''
      }`
    );

    // Create subqueries
    const questionChoixSubquery = this.getQuestionChoixQuery();
    const actionsSubquery = this.getActionsSubquery();

    // Check filter conditions
    const {
      actionIds,
      collectiviteId,
      questionIds,
      referentielIds,
      thematiqueId,
    } = input || {};
    const conditions: (ReturnType<typeof eq> | SQL)[] = [];

    // questions liées à au moins une des actions
    if (actionIds && actionIds.length > 0) {
      conditions.push(
        arrayOverlapsPatched(actionsSubquery.actionIds, actionIds)
      );
    }

    // questions ayant au moins une action dans un des référentiels OU liées à
    // aucun référentiel
    if (referentielIds && referentielIds.length > 0) {
      conditions.push(
        or(
          arrayOverlapsPatched(actionsSubquery.referentielIds, referentielIds),
          isNull(actionsSubquery.referentielIds)
        ) as SQL
      );
    }

    if (thematiqueId) {
      conditions.push(eq(questionTable.thematiqueId, thematiqueId));
    }
    if (questionIds && questionIds.length > 0) {
      conditions.push(inArray(questionTable.id, questionIds));
    }

    // filtre par type de collectivité : questions sans restriction ou concernant ce type
    if (collectiviteId !== undefined) {
      conditions.push(
        or(
          isNull(questionTable.typesCollectivitesConcernees),
          sql`${questionTable.typesCollectivitesConcernees} @> ARRAY[${collectiviteTable.type}]::text[]`
        ) as SQL
      );
    }

    // Main query with joined subqueries
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
      ) as typeof baseQuery;
    }

    const queryWithConditions =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    const questions = await queryWithConditions.orderBy(
      questionTable.ordonnancement,
      questionTable.id
    );

    this.logger.log(`Successfully fetched ${questions.length} questions`);

    return questions;
  }

  /**
   * Sous-requête : agrège par question les ID des mesures liées des référentiels
   */
  private getActionsSubquery() {
    return this.databaseService.db
      .select({
        questionId: questionActionTable.questionId,
        actionIds: sql<
          string[]
        >`array_agg(${questionActionTable.actionId})::text[]`.as('action_ids'),
        referentielIds: sql<
          string[]
        >`array_agg(${actionRelationTable.referentiel})::text[]`.as(
          'referentiel_ids'
        ),
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
