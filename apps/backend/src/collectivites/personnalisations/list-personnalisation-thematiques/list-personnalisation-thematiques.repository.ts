import { Injectable } from '@nestjs/common';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { PersonnalisationThematique } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  and,
  countDistinct,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { collectiviteTable } from '../../shared/models/collectivite.table';
import { questionThematiqueTable } from '../models/question-thematique.table';
import { questionTable } from '../models/question.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';
import { ListThematiquesInput } from './list-personnalisation-thematiques.input';

type ThematiqueRow = {
  id: string;
  nom: string | null;
  questionsCount: number;
  reponsesCount: number;
  referentiels: ReferentielId[] | null;
};

@Injectable()
export class ListPersonnalisationThematiquesRepository {
  constructor() {}

  async listByCollectiviteId(
    input: ListThematiquesInput,
    tx: Transaction
  ): Promise<PersonnalisationThematique[]> {
    const { collectiviteId, actionIds, thematiqueIds, referentielIds } = input;

    const reponseSubquery = this.getReponseSubquery(collectiviteId, tx);

    const collectiviteQuestionCondition = or(
      isNull(questionTable.typesCollectivitesConcernees),
      sql`${questionTable.typesCollectivitesConcernees} @> ARRAY[${collectiviteTable.type}]::text[]`
    );
    const whereConditions = [collectiviteQuestionCondition];
    if (actionIds?.length) {
      whereConditions.push(
        exists(
          tx
            .select({ id: questionActionTable.questionId })
            .from(questionActionTable)
            .where(
              and(
                eq(questionActionTable.questionId, questionTable.id),
                inArray(questionActionTable.actionId, actionIds)
              )
            )
        )
      );
    }
    if (thematiqueIds?.length) {
      whereConditions.push(inArray(questionThematiqueTable.id, thematiqueIds));
    }
    // questions ayant au moins une action dans un des référentiels
    if (referentielIds?.length) {
      const referentielOverlapQuery = tx
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
      whereConditions.push(or(exists(referentielOverlapQuery)) as SQL);
    }

    const rows = await tx
      .select({
        id: questionThematiqueTable.id,
        nom: questionThematiqueTable.nom,
        questionsCount: countDistinct(questionTable.id),
        reponsesCount: countDistinct(reponseSubquery.questionId),
        referentiels: sql<
          ReferentielId[] | null
        >`array_remove(array_agg(distinct ${actionRelationTable.referentiel}::text), null)`.as(
          'referentiels'
        ),
      })
      .from(questionThematiqueTable)
      .innerJoin(collectiviteTable, eq(collectiviteTable.id, collectiviteId))
      .innerJoin(
        questionTable,
        eq(questionTable.thematiqueId, questionThematiqueTable.id)
      )
      .leftJoin(
        reponseSubquery,
        eq(reponseSubquery.questionId, questionTable.id)
      )
      .leftJoin(
        questionActionTable,
        eq(questionActionTable.questionId, questionTable.id)
      )
      .leftJoin(
        actionRelationTable,
        eq(actionRelationTable.id, questionActionTable.actionId)
      )
      .where(and(...whereConditions))
      .groupBy(questionThematiqueTable.id, questionThematiqueTable.nom)
      .orderBy(
        sql`(case when ${questionThematiqueTable.id} = 'identite'::text then '0' else ${questionThematiqueTable.nom} end)`
      );

    return rows
      .filter((row) => row.questionsCount > 0)
      .map((row) => this.mapToPersonnalisationThematique(row));
  }

  private mapToPersonnalisationThematique(
    row: ThematiqueRow
  ): PersonnalisationThematique {
    const questionsCount = Number(row.questionsCount);
    const reponsesCount = Number(row.reponsesCount);
    const referentielsRaw = row.referentiels;
    const referentiels = Array.isArray(referentielsRaw)
      ? referentielsRaw.filter(Boolean)
      : [];
    return {
      id: row.id,
      nom: row.nom ?? '',
      isComplete: questionsCount > 0 && reponsesCount >= questionsCount,
      questionsCount,
      reponsesCount,
      referentiels,
    };
  }

  private getReponseSubquery(collectiviteId: number, tx: Transaction) {
    return tx
      .select({
        questionId: reponseBinaireTable.questionId,
      })
      .from(reponseBinaireTable)
      .where(
        and(
          eq(reponseBinaireTable.collectiviteId, collectiviteId),
          isNotNull(reponseBinaireTable.reponse)
        )
      )
      .union(
        tx
          .select({
            questionId: reponseChoixTable.questionId,
          })
          .from(reponseChoixTable)
          .where(
            and(
              eq(reponseChoixTable.collectiviteId, collectiviteId),
              isNotNull(reponseChoixTable.reponse),
              sql`${reponseChoixTable.reponse} <> ''`
            )
          )
      )
      .union(
        tx
          .select({
            questionId: reponseProportionTable.questionId,
          })
          .from(reponseProportionTable)
          .where(
            and(
              eq(reponseProportionTable.collectiviteId, collectiviteId),
              isNotNull(reponseProportionTable.reponse)
            )
          )
      )
      .as('reponse');
  }
}
