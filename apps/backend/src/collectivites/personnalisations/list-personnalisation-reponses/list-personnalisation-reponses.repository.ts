import { Injectable, Logger } from '@nestjs/common';
import { justificationTable } from '@tet/backend/collectivites/personnalisations/models/justification.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { reponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/reponse-binaire.table';
import { reponseChoixTable } from '@tet/backend/collectivites/personnalisations/models/reponse-choix.table';
import { reponseProportionTable } from '@tet/backend/collectivites/personnalisations/models/reponse-proportion.table';
import { collectiviteBanatic2025CompetenceTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-competence.table';
import { collectiviteBanatic2025TransfertTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-transfert.table';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  PersonnalisationReponse,
  PersonnalisationReponseValue,
} from '@tet/domain/collectivites';
import { and, eq, inArray, isNotNull, or, SQL, sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import {
  ListPersonnalisationReponsesErrorEnum,
  type ListPersonnalisationReponsesError,
} from './list-personnalisation-reponses.errors';
import type { ListPersonnalisationReponsesInput } from './list-personnalisation-reponses.input';

type CompetenceSubquery = ReturnType<
  ListPersonnalisationReponsesRepository['getCompetenceSubquery']
>;

@Injectable()
export class ListPersonnalisationReponsesRepository {
  private readonly logger = new Logger(
    ListPersonnalisationReponsesRepository.name
  );

  constructor() {}

  async listReponses(
    input: ListPersonnalisationReponsesInput,
    tx: Transaction
  ): Promise<
    Result<PersonnalisationReponse[], ListPersonnalisationReponsesError>
  > {
    const { collectiviteId, questionIds } = input;

    try {
      const questionTypeSubquery = this.getQuestionTypeSubquery(tx);
      const competenceSubquery = this.getCompetenceSubquery(collectiviteId, tx);
      const reponseSubquery = this.buildReponseUnionQuery(
        collectiviteId,
        competenceSubquery,
        tx
      ).as('reponse');
      const justificationSubquery = this.getJustificationSubquery(
        collectiviteId,
        tx
      );

      const conditions: SQL[] = [];
      if (questionIds !== undefined) {
        if (questionIds.length === 0) {
          // tableau vide explicite : aucune question (≠ undefined = toutes les questions avec réponse)
          conditions.push(sql`false`);
        } else {
          conditions.push(inArray(questionTypeSubquery.id, questionIds));
        }
      }
      if (!input.withEmptyReponse) {
        conditions.push(isNotNull(reponseSubquery.value));
      }

      const query = tx
        .select({
          questionId: questionTypeSubquery.id,
          questionType: questionTypeSubquery.type,
          reponse: reponseSubquery.value,
          justification: justificationSubquery.justification,
          competenceCode: competenceSubquery.competenceCode,
          competenceIntitule: competenceSubquery.competenceIntitule,
          competenceExercee: competenceSubquery.competenceExercee,
          natureTransfert: competenceSubquery.natureTransfert,
        })
        .from(questionTypeSubquery)
        .leftJoin(questionTable, eq(questionTable.id, questionTypeSubquery.id))
        .leftJoin(
          reponseSubquery,
          eq(reponseSubquery.questionId, questionTypeSubquery.id)
        )
        .leftJoin(
          justificationSubquery,
          eq(justificationSubquery.questionId, questionTypeSubquery.id)
        )
        .leftJoin(
          competenceSubquery,
          eq(competenceSubquery.competenceCode, questionTable.competenceCode)
        );

      if (conditions.length) query.where(and(...conditions));

      const result = await query;
      return {
        success: true,
        data: result as PersonnalisationReponse[],
      };
    } catch (error) {
      this.logger.error(
        `Erreur de chargement des réponses ${
          (error as DatabaseError).cause
        } ${collectiviteId} ${questionIds?.join(',')}`
      );
      return {
        success: false,
        error: ListPersonnalisationReponsesErrorEnum.DATABASE_ERROR,
      };
    }
  }

  /**
   * Sous-requête : type de question
   */
  private getQuestionTypeSubquery(tx: Transaction) {
    return tx
      .select({ id: questionTable.id, type: questionTable.type })
      .from(questionTable)
      .as('questionType');
  }

  /**
   * Sous-requête : justification
   */
  private getJustificationSubquery(collectiviteId: number, tx: Transaction) {
    return tx
      .select({
        questionId: justificationTable.questionId,
        justification: justificationTable.texte,
      })
      .from(justificationTable)
      .where(eq(justificationTable.collectiviteId, collectiviteId))
      .as('justification');
  }

  /**
   * Sous-requête des identifiants de questions ayant une réponse « pleine »
   * (même définition que listReponses sans withEmptyReponse), pour jointures
   * (ex. comptage par thématique).
   */
  getAnsweredQuestionIdsSubquery(collectiviteId: number, tx: Transaction) {
    const competenceSubquery = this.getCompetenceSubquery(collectiviteId, tx);
    const union = this.buildReponseUnionQuery(
      collectiviteId,
      competenceSubquery,
      tx
    );
    const reponseUnion = union.as('reponseUnion');
    return tx
      .select({ questionId: reponseUnion.questionId })
      .from(reponseUnion)
      .where(isNotNull(reponseUnion.value))
      .as('reponse');
  }

  /**
   * Identifiants distincts des questions ayant une réponse « pleine »
   * (même définition que listReponses sans withEmptyReponse).
   */
  async listAnsweredQuestionIds(
    collectiviteId: number,
    tx: Transaction
  ): Promise<string[]> {
    const sub = this.getAnsweredQuestionIdsSubquery(collectiviteId, tx);
    const rows = await tx
      .selectDistinct({ questionId: sub.questionId })
      .from(sub);
    return rows.map((r) => r.questionId);
  }

  /**
   * UNION des réponses (binaire avec compétence Banatic, choix, proportion).
   * cast toutes les réponses en jsonb pour que l'UNION fonctionne
   */
  private buildReponseUnionQuery(
    collectiviteId: number,
    competenceSubquery: CompetenceSubquery,
    tx: Transaction
  ) {
    return tx
      .select({
        questionId: questionTable.id,
        value:
          sql<PersonnalisationReponseValue>`to_jsonb(coalesce(${reponseBinaireTable.reponse}, ${competenceSubquery.competenceExercee}))`.as(
            'value'
          ),
      })
      .from(questionTable)
      .leftJoin(
        reponseBinaireTable,
        and(
          eq(reponseBinaireTable.questionId, questionTable.id),
          eq(reponseBinaireTable.collectiviteId, collectiviteId)
        )
      )
      .leftJoin(
        competenceSubquery,
        eq(competenceSubquery.competenceCode, questionTable.competenceCode)
      )
      .where(
        and(
          eq(questionTable.type, 'binaire'),
          or(
            isNotNull(reponseBinaireTable.questionId),
            isNotNull(competenceSubquery.competenceExercee)
          )
        )
      )
      .union(
        tx
          .select({
            questionId: reponseChoixTable.questionId,
            value:
              sql<PersonnalisationReponseValue>`to_jsonb(nullif(${reponseChoixTable.reponse}, ''))`.as(
                'value'
              ),
          })
          .from(reponseChoixTable)
          .where(eq(reponseChoixTable.collectiviteId, collectiviteId))
      )
      .union(
        tx
          .select({
            questionId: reponseProportionTable.questionId,
            value:
              sql<PersonnalisationReponseValue>`to_jsonb(${reponseProportionTable.reponse})`.as(
                'value'
              ),
          })
          .from(reponseProportionTable)
          .where(eq(reponseProportionTable.collectiviteId, collectiviteId))
      );
  }

  /**
   * Sous-requête : compétence Banatic associée à  la question
   */
  private getCompetenceSubquery(collectiviteId: number, tx: Transaction) {
    return tx
      .select({
        competenceCode: banatic2025CompetenceTable.competenceCode,
        competenceIntitule: banatic2025CompetenceTable.intitule,
        competenceExercee: collectiviteBanatic2025CompetenceTable.exercice,
        natureTransfert: collectiviteBanatic2025TransfertTable.natureTransfert,
      })
      .from(banatic2025CompetenceTable)
      .leftJoin(
        collectiviteBanatic2025CompetenceTable,
        and(
          eq(
            collectiviteBanatic2025CompetenceTable.collectiviteId,
            collectiviteId
          ),
          eq(
            collectiviteBanatic2025CompetenceTable.competenceCode,
            banatic2025CompetenceTable.competenceCode
          )
        )
      )
      .leftJoin(
        collectiviteBanatic2025TransfertTable,
        and(
          eq(
            collectiviteBanatic2025TransfertTable.collectiviteId,
            collectiviteId
          ),
          eq(
            collectiviteBanatic2025TransfertTable.competenceCode,
            banatic2025CompetenceTable.competenceCode
          )
        )
      )
      .as('competence');
  }
}
