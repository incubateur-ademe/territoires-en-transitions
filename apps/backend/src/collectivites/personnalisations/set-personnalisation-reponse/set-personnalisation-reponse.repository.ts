import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  PersonnalisationReponseValue,
  QuestionType,
} from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import { justificationTable } from '../models/justification.table';
import { questionTable } from '../models/question.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';
import {
  SetPersonnalisationReponseError,
  SetPersonnalisationReponseErrorEnum,
} from './set-personnalisation-reponse.errors';
import { SetPersonnalisationReponseInput } from './set-personnalisation-reponse.input';

type SetPersonnalisationReponseOutput = {
  questionType: QuestionType;
  reponse: PersonnalisationReponseValue;
};

@Injectable()
export class SetPersonnalisationReponseRepository {
  private readonly logger = new Logger(
    SetPersonnalisationReponseRepository.name
  );

  constructor() {}

  async setReponse(
    input: SetPersonnalisationReponseInput,
    tx: Transaction
  ): Promise<
    Result<SetPersonnalisationReponseOutput, SetPersonnalisationReponseError>
  > {
    const { collectiviteId, questionId, reponse } = input;

    try {
      // récupère le type de la question
      const [question] = await tx
        .select({ type: questionTable.type })
        .from(questionTable)
        .where(eq(questionTable.id, questionId))
        .limit(1);

      if (!question) {
        this.logger.log(
          `Erreur de lecture du type de la question ${questionId}`
        );
        return {
          success: false,
          error: SetPersonnalisationReponseErrorEnum.QUESTION_NOT_FOUND,
        };
      }

      // insère ou met à jour la réponse selon le type de question
      let reponseCreee: PersonnalisationReponseValue;
      if (question.type === 'binaire') {
        if (reponse !== null && typeof reponse !== 'boolean') {
          this.logger.error(
            `La réponse pour une question binaire doit être un booléen ou null (${questionId}: ${reponse})`
          );
          return {
            success: false,
            error: SetPersonnalisationReponseErrorEnum.INVALID_RESPONSE_TYPE,
          };
        }
        const [result] = await tx
          .insert(reponseBinaireTable)
          .values({
            collectiviteId,
            questionId,
            reponse,
          })
          .onConflictDoUpdate({
            target: [
              reponseBinaireTable.collectiviteId,
              reponseBinaireTable.questionId,
            ],
            set: buildConflictUpdateColumns(reponseBinaireTable, ['reponse']),
          })
          .returning();
        reponseCreee = result.reponse;
      } else if (question.type === 'proportion') {
        if (
          reponse !== null &&
          (typeof reponse !== 'number' ||
            !Number.isFinite(reponse) ||
            reponse < 0 ||
            reponse > 1)
        ) {
          this.logger.error(
            `La réponse pour une question proportion doit être un nombre fini compris entre 0 et 1 (${questionId}: ${reponse})`
          );
          return {
            success: false,
            error: SetPersonnalisationReponseErrorEnum.INVALID_RESPONSE_TYPE,
          };
        }
        const [result] = await tx
          .insert(reponseProportionTable)
          .values({
            collectiviteId,
            questionId,
            reponse,
          })
          .onConflictDoUpdate({
            target: [
              reponseProportionTable.collectiviteId,
              reponseProportionTable.questionId,
            ],
            set: buildConflictUpdateColumns(reponseProportionTable, [
              'reponse',
            ]),
          })
          .returning();
        reponseCreee = result.reponse;
      } else if (question.type === 'choix') {
        if (reponse !== null && typeof reponse !== 'string') {
          this.logger.error(
            `La réponse pour une question à choix doit être une chaîne de caractères ou null (${questionId}: ${reponse})`
          );
          return {
            success: false,
            error: SetPersonnalisationReponseErrorEnum.INVALID_RESPONSE_TYPE,
          };
        }
        const [result] = await tx
          .insert(reponseChoixTable)
          .values({
            collectiviteId,
            questionId,
            reponse,
          })
          .onConflictDoUpdate({
            target: [
              reponseChoixTable.collectiviteId,
              reponseChoixTable.questionId,
            ],
            set: buildConflictUpdateColumns(reponseChoixTable, ['reponse']),
          })
          .returning();
        reponseCreee = result.reponse;
      } else {
        this.logger.log(`Type de question non supporté ${question.type}`);
        return {
          success: false,
          error: SetPersonnalisationReponseErrorEnum.UNSUPPORTED_QUESTION_TYPE,
        };
      }

      return {
        success: true,
        data: { questionType: question.type, reponse: reponseCreee },
      };
    } catch (error) {
      this.logger.error(
        `Erreur d'enregistrement de la réponse (${error}) ${collectiviteId} ${questionId}`
      );
      return {
        success: false,
        error: SetPersonnalisationReponseErrorEnum.DATABASE_ERROR,
      };
    }
  }

  async setJustification(
    input: SetPersonnalisationReponseInput,
    user: AuthenticatedUser,
    tx: Transaction
  ): Promise<Result<string | null, SetPersonnalisationReponseError>> {
    const { collectiviteId, questionId, justification } = input;
    if (justification === undefined) {
      return { success: true, data: null };
    }

    try {
      const result = await tx
        .insert(justificationTable)
        .values({
          collectiviteId,
          questionId,
          texte: justification,
          modifiedAt: new Date().toISOString(),
          modifiedBy: user.id,
        })
        .onConflictDoUpdate({
          target: [
            justificationTable.collectiviteId,
            justificationTable.questionId,
          ],
          set: buildConflictUpdateColumns(justificationTable, [
            'texte',
            'modifiedAt',
            'modifiedBy',
          ]),
        })
        .returning();
      return { success: true, data: result[0]?.texte ?? null };
    } catch (error) {
      this.logger.error(
        `Erreur d'enregistrement de la justification (${
          (error as DatabaseError).message
        } - ${(error as DatabaseError).cause}) ${collectiviteId} ${questionId}`
      );

      return {
        success: false,
        error: SetPersonnalisationReponseErrorEnum.DATABASE_ERROR,
      };
    }
  }
}
