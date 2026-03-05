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
import { eq, inArray, sql } from 'drizzle-orm';
import {
  GetPersonnalisationReponsesErrorEnum,
  type GetPersonnalisationReponsesError,
} from './get-personnalisation-reponses.errors';
import type { GetPersonnalisationReponsesInput } from './get-personnalisation-reponses.input';

@Injectable()
export class GetPersonnalisationReponsesRepository {
  private readonly logger = new Logger(
    GetPersonnalisationReponsesRepository.name
  );

  constructor() {}

  async getReponses(
    input: GetPersonnalisationReponsesInput,
    tx: Transaction
  ): Promise<
    Result<PersonnalisationReponse[], GetPersonnalisationReponsesError>
  > {
    const { collectiviteId, questionIds } = input;

    try {
      const questionTypeSubquery = this.getQuestionTypeSubquery(tx);
      const reponseSubquery = this.getReponseSubquery(collectiviteId, tx);
      const justificationSubquery = this.getJustificationSubquery(
        collectiviteId,
        tx
      );

      const query = tx
        .select({
          questionId: questionTypeSubquery.id,
          questionType: questionTypeSubquery.type,
          reponse: reponseSubquery.value,
          justification: justificationSubquery.justification,
        })
        .from(questionTypeSubquery)
        .innerJoin(
          reponseSubquery,
          eq(reponseSubquery.questionId, questionTypeSubquery.id)
        )
        .leftJoin(
          justificationSubquery,
          eq(justificationSubquery.questionId, questionTypeSubquery.id)
        );

      if (questionIds && questionIds.length > 0) {
        query.where(inArray(questionTypeSubquery.id, questionIds));
      }

      const result = await query;
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(
        `Erreur de chargement des réponses ${error} ${collectiviteId} ${questionIds?.join(
          ','
        )}`
      );
      return {
        success: false,
        error: GetPersonnalisationReponsesErrorEnum.DATABASE_ERROR,
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
              sql<PersonnalisationReponseValue>`to_jsonb(${reponseChoixTable.reponse})`.as(
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
