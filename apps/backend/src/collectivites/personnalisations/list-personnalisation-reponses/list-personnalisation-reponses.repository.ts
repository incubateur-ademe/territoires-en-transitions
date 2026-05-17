import { Injectable, Logger } from '@nestjs/common';
import { justificationTable } from '@tet/backend/collectivites/personnalisations/models/justification.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { PersonnalisationReponse } from '@tet/domain/collectivites';
import { and, eq, inArray, isNotNull, SQL, sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import { PersonnalisationReponsesEffectivesRepository } from '../services/personnalisation-reponses-effectives.repository';
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

  constructor(
    private readonly personnalisationReponsesEffectivesRepository: PersonnalisationReponsesEffectivesRepository
  ) {}

  async listReponses(
    input: ListPersonnalisationReponsesInput,
    tx: Transaction
  ): Promise<
    Result<PersonnalisationReponse[], ListPersonnalisationReponsesError>
  > {
    const { collectiviteId, questionIds } = input;

    try {
      const questionTypeSubquery = this.getQuestionTypeSubquery(tx);
      const competenceSubquery =
        this.personnalisationReponsesEffectivesRepository.getCompetenceSubquery(
          collectiviteId,
          tx
        );
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

      const reponsesPayload =
        input.reponsesEffectives ??
        (await this.personnalisationReponsesEffectivesRepository.getReponsesEffectivesPayload(
          collectiviteId,
          tx
        ));

      const query = tx
        .select({
          questionId: questionTypeSubquery.id,
          questionType: questionTypeSubquery.type,
          justification: justificationSubquery.justification,
          competenceCode: competenceSubquery.competenceCode,
          competenceIntitule: competenceSubquery.competenceIntitule,
          competenceExercee: competenceSubquery.competenceExercee,
          natureTransfert: competenceSubquery.natureTransfert,
        })
        .from(questionTypeSubquery)
        .leftJoin(questionTable, eq(questionTable.id, questionTypeSubquery.id))
        .leftJoin(
          justificationSubquery,
          eq(justificationSubquery.questionId, questionTypeSubquery.id)
        )
        .leftJoin(
          competenceSubquery,
          eq(competenceSubquery.competenceCode, questionTable.competenceCode)
        );

      if (conditions.length) query.where(and(...conditions));

      const rows = await query;
      return {
        success: true,
        data: rows.map((row) => ({
          ...row,
          reponse: reponsesPayload[row.questionId] ?? null,
        })) as PersonnalisationReponse[],
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
   */
  getAnsweredQuestionIdsSubquery(collectiviteId: number, tx: Transaction) {
    return this.personnalisationReponsesEffectivesRepository.getAnsweredQuestionIdsSubquery(
      collectiviteId,
      tx
    );
  }

  /**
   * Identifiants distincts des questions ayant une réponse « pleine »
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

  async countQuestionsWithDefinedCompetence(
    collectiviteId: number,
    questionIds: string[],
    tx: Transaction
  ): Promise<number> {
    if (questionIds.length === 0) {
      return 0;
    }

    const competenceSubquery =
      this.personnalisationReponsesEffectivesRepository.getCompetenceSubquery(
        collectiviteId,
        tx
      );
    const rows = await tx
      .selectDistinct({ questionId: questionTable.id })
      .from(questionTable)
      .leftJoin(
        competenceSubquery,
        eq(competenceSubquery.competenceCode, questionTable.competenceCode)
      )
      .where(
        and(
          inArray(questionTable.id, questionIds),
          isNotNull(competenceSubquery.competenceExercee)
        )
      );

    return rows.length;
  }
}
