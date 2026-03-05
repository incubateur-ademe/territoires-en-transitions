import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { DomainError } from '@tet/backend/utils/domain-error';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { normalizeCaughtError } from '@tet/backend/utils/normalize-caught-error';
import { Result } from '@tet/backend/utils/result.type';
import { PersonnalisationReponse } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  SetPersonnalisationReponseError,
  SetPersonnalisationReponseErrorEnum,
} from './set-personnalisation-reponse.errors';
import { SetPersonnalisationReponseInput } from './set-personnalisation-reponse.input';
import { SetPersonnalisationReponseRepository } from './set-personnalisation-reponse.repository';

@Injectable()
export class SetPersonnalisationReponseService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly setPersonnalisationReponseRepository: SetPersonnalisationReponseRepository
  ) {}

  async setPersonnalisationReponse(
    input: SetPersonnalisationReponseInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<PersonnalisationReponse, SetPersonnalisationReponseError>> {
    const { collectiviteId, questionId, justification } = input;

    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<
      Result<PersonnalisationReponse, SetPersonnalisationReponseError>
    > => {
      // vérifie les permissions d'écriture sur la collectivité
      const isAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['REFERENTIELS.MUTATE'],
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true,
        transaction
      );
      if (!isAllowed) {
        throw new DomainError(SetPersonnalisationReponseErrorEnum.UNAUTHORIZED);
      }

      // insère/màj la réponse
      const setReponseResult =
        await this.setPersonnalisationReponseRepository.setReponse(
          input,
          transaction
        );
      if (!setReponseResult.success) {
        throw new DomainError(setReponseResult.error);
      }

      const { questionType, reponse } = setReponseResult.data;

      if (justification === undefined) {
        const getJustificationResult =
          await this.setPersonnalisationReponseRepository.getJustification(
            {
              collectiviteId,
              questionId,
            },
            transaction
          );

        if (!getJustificationResult.success) {
          throw new DomainError(getJustificationResult.error);
        }
        return {
          success: true,
          data: {
            questionId,
            questionType,
            justification: getJustificationResult.data,
            reponse,
          },
        };
      }

      // insère/màj la justification
      const setJustificationResult =
        await this.setPersonnalisationReponseRepository.setJustification(
          input,
          user,
          transaction
        );
      if (!setJustificationResult.success) {
        throw new DomainError(setJustificationResult.error);
      }

      return {
        success: true,
        data: {
          questionId,
          questionType,
          justification: setJustificationResult.data,
          reponse,
        },
      };
    };

    const execute = () =>
      tx
        ? executeInTransaction(tx)
        : this.databaseService.db.transaction((newTx) =>
            executeInTransaction(newTx)
          );

    return execute().catch((error) => {
      const normalizedError = normalizeCaughtError(
        error,
        SetPersonnalisationReponseErrorEnum,
        SetPersonnalisationReponseErrorEnum.DATABASE_ERROR
      );
      return {
        success: false,
        error: normalizedError,
      };
    });
  }
}
