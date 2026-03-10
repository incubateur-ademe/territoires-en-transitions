import { Injectable } from '@nestjs/common';
import { questionChoixTable } from '@tet/backend/collectivites/personnalisations/models/question-choix.table';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  CollectiviteType,
  QuestionChoix,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { and, eq, exists, ilike, inArray, or, SQL, sql } from 'drizzle-orm';
import type { ListPersonnalisationQuestionsFilters } from './list-personnalisation-questions.input';

@Injectable()
export class ListPersonnalisationQuestionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private getQuestionChoixSubquery() {
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
            ORDER BY ${questionChoixTable.ordonnancement} NULLS LAST, ${questionChoixTable.id}
          )
        `.as('choix'),
      })
      .from(questionChoixTable)
      .groupBy(questionChoixTable.questionId);

    return query.as('questionChoix');
  }

  private getActionsSubquery(enabledReferentiels: ReferentielId[]) {
    const base = this.databaseService.db
      .select({
        questionId: questionActionTable.questionId,
        actionIds: sql<string[]>`array_agg(
            distinct ${actionRelationTable.id}
            order by ${actionRelationTable.id}
          )::text[]`.as('action_ids'),
        referentielIds: sql<string[]>`array_agg(
            distinct ${actionRelationTable.referentiel}
            order by ${actionRelationTable.referentiel}
          )::text[]`.as('referentiel_ids'),
      })
      .from(questionActionTable)
      .innerJoin(
        actionRelationTable,
        eq(questionActionTable.actionId, actionRelationTable.id)
      )
      .groupBy(questionActionTable.questionId);

    return base
      .where(inArray(actionRelationTable.referentiel, enabledReferentiels))
      .as('actions');
  }

  private buildQuestionFilterConditions(
    input: ListPersonnalisationQuestionsFilters,
    enabledReferentiels: ReferentielId[]
  ): (ReturnType<typeof eq> | SQL)[] {
    const { actionIds, questionIds, referentielIds, thematiqueIds } = input;
    const conditions: (ReturnType<typeof eq> | SQL)[] = [];

    if (actionIds && actionIds.length > 0) {
      const actionIdsFilterQuery = this.databaseService.db
        .select({ questionId: questionActionTable.questionId })
        .from(questionActionTable)
        .where(
          and(
            eq(questionActionTable.questionId, questionTable.id),
            or(
              ...actionIds.flatMap((actionId) => [
                eq(questionActionTable.actionId, actionId),
                ilike(questionActionTable.actionId, `${actionId}.%`),
              ])
            )
          )
        );
      conditions.push(exists(actionIdsFilterQuery));
    }

    const isFilteringByReferentielIds =
      referentielIds && referentielIds.length > 0;
    const referentielIdsFilter = isFilteringByReferentielIds
      ? enabledReferentiels.filter((id) => referentielIds.includes(id))
      : enabledReferentiels;
    if (referentielIdsFilter.length > 0) {
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
            inArray(actionRelationTable.referentiel, referentielIdsFilter)
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

    return conditions;
  }

  async listQuestionsWithChoices(
    enabledReferentiels: ReferentielId[],
    input: ListPersonnalisationQuestionsFilters = {}
  ): Promise<QuestionWithChoices[]> {
    const questionChoixSubquery = this.getQuestionChoixSubquery();
    const actionsSubquery = this.getActionsSubquery(enabledReferentiels);
    const conditions = this.buildQuestionFilterConditions(
      input,
      enabledReferentiels
    );

    const baseQuery = this.databaseService.db
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

    const queryWithConditions =
      conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    return (await queryWithConditions.orderBy(
      questionTable.ordonnancement,
      questionTable.id
    )) as QuestionWithChoices[];
  }
}
