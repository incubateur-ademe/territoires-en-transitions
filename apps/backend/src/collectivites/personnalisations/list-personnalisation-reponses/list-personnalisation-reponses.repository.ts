import { Injectable, Logger } from '@nestjs/common';
import { justificationTable } from '@tet/backend/collectivites/personnalisations/models/justification.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { reponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/reponse-binaire.table';
import { reponseChoixTable } from '@tet/backend/collectivites/personnalisations/models/reponse-choix.table';
import { reponseProportionTable } from '@tet/backend/collectivites/personnalisations/models/reponse-proportion.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  PersonnalisationReponse,
  PersonnalisationReponseValue,
} from '@tet/domain/collectivites';
import { and, eq, inArray, isNotNull, SQL, sql } from 'drizzle-orm';
import {
  ListPersonnalisationReponsesErrorEnum,
  type ListPersonnalisationReponsesError,
} from './list-personnalisation-reponses.errors';
import type { ListPersonnalisationReponsesInput } from './list-personnalisation-reponses.input';

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
      const reponseSubquery = this.getReponseSubquery(collectiviteId, tx);
      const justificationSubquery = this.getJustificationSubquery(
        collectiviteId,
        tx
      );

      const conditions: SQL[] = [];
      if (questionIds && questionIds.length > 0) {
        conditions.push(inArray(questionTypeSubquery.id, questionIds));
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
        })
        .from(questionTypeSubquery)
        .leftJoin(
          reponseSubquery,
          eq(reponseSubquery.questionId, questionTypeSubquery.id)
        )
        .leftJoin(
          justificationSubquery,
          eq(justificationSubquery.questionId, questionTypeSubquery.id)
        );

      if (conditions.length) query.where(and(...conditions));

      const result = await query;
      return {
        success: true,
        data: result as PersonnalisationReponse[],
      };
    } catch (error) {
      this.logger.error(
        `Erreur de chargement des réponses ${error} ${collectiviteId} ${questionIds?.join(
          ','
        )}`
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
   * Sous-requête : réponse
   */
  private getReponseSubquery(collectiviteId: number, tx: Transaction) {
    // cast toutes les réponses en jsonb pour que l'UNION fonctionne
    return tx
      .select({
        questionId: reponseBinaireTable.questionId,
        value:
          sql<PersonnalisationReponseValue>`to_jsonb(${reponseBinaireTable.reponse})`.as(
            'value'
          ),
      })
      .from(reponseBinaireTable)
      .where(eq(reponseBinaireTable.collectiviteId, collectiviteId))
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
      )
      .as('reponse');
  }
}
