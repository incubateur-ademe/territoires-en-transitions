import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { eq, InferSelectModel } from 'drizzle-orm';
import { questionTable } from '../models/question.table';
import { reponseBinaireTable } from '../models/reponse-binaire.table';
import { reponseChoixTable } from '../models/reponse-choix.table';
import { reponseProportionTable } from '../models/reponse-proportion.table';
import {
  SetPersonnalisationReponseError,
  SetPersonnalisationReponseErrorEnum,
} from './set-personnalisation-reponse.errors';

type ReponseBinaireType = InferSelectModel<typeof reponseBinaireTable>;
type ReponseProportionType = InferSelectModel<typeof reponseProportionTable>;
type ReponseChoixType = InferSelectModel<typeof reponseChoixTable>;

type PersonnalisationReponseType =
  | ReponseBinaireType
  | ReponseProportionType
  | ReponseChoixType;

@Injectable()
export class SetPersonnalisationReponseService {
  private readonly logger = new Logger(SetPersonnalisationReponseService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async setPersonnalisationReponse(
    collectiviteId: number,
    questionId: string,
    reponse: boolean | number | string | null,
    user: AuthenticatedUser
  ): Promise<
    Result<PersonnalisationReponseType, SetPersonnalisationReponseError>
  > {
    // vérifie les permissions d'écriture sur la collectivité
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: SetPersonnalisationReponseErrorEnum.UNAUTHORIZED,
      };
    }

    // récupère le type de la question
    const [question] = await this.databaseService.db
      .select({ type: questionTable.type })
      .from(questionTable)
      .where(eq(questionTable.id, questionId))
      .limit(1);

    if (!question) {
      this.logger.log(`Erreur de lecture du type de la question ${questionId}`);
      return {
        success: false,
        error: SetPersonnalisationReponseErrorEnum.QUESTION_NOT_FOUND,
      };
    }

    // insère ou met à jour la réponse selon le type de question
    let reponseCreee: PersonnalisationReponseType;
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
      const [result] = await this.databaseService.db
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
      reponseCreee = result;
    } else if (question.type === 'proportion') {
      if (
        reponse !== null &&
        (typeof reponse !== 'number' || !Number.isFinite(reponse))
      ) {
        this.logger.error(
          `La réponse pour une question proportion doit être un nombre fini (${questionId}: ${reponse})`
        );
        return {
          success: false,
          error: SetPersonnalisationReponseErrorEnum.INVALID_RESPONSE_TYPE,
        };
      }
      const [result] = await this.databaseService.db
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
          set: buildConflictUpdateColumns(reponseProportionTable, ['reponse']),
        })
        .returning();
      reponseCreee = result;
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
      const [result] = await this.databaseService.db
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
      reponseCreee = result;
    } else {
      this.logger.log(`Type de question non supporté ${question.type}`);
      return {
        success: false,
        error: SetPersonnalisationReponseErrorEnum.UNSUPPORTED_QUESTION_TYPE,
      };
    }

    return {
      success: true,
      data: reponseCreee,
    };
  }
}
