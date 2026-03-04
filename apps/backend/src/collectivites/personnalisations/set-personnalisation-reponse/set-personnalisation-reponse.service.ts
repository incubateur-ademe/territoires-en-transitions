import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
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
    private readonly transactionManager: TransactionManager,
    private readonly permissionService: PermissionService,
    private readonly setPersonnalisationReponseRepository: SetPersonnalisationReponseRepository
  ) {}

  async setPersonnalisationReponse(
    input: SetPersonnalisationReponseInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<PersonnalisationReponse, SetPersonnalisationReponseError>> {
    const { collectiviteId, questionId, justification } = input;

    const operation = async (transaction: Transaction) => {
      try {
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
          return failure(SetPersonnalisationReponseErrorEnum.UNAUTHORIZED);
        }

        // insère/màj la réponse
        const setReponseResult =
          await this.setPersonnalisationReponseRepository.setReponse(
            input,
            transaction
          );
        if (!setReponseResult.success) {
          return failure(setReponseResult.error);
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
            return failure(getJustificationResult.error);
          }
          return success({
            questionId,
            questionType,
            justification: getJustificationResult.data,
            reponse,
          });
        }

        // insère/màj la justification
        const setJustificationResult =
          await this.setPersonnalisationReponseRepository.setJustification(
            input,
            user,
            transaction
          );
        if (!setJustificationResult.success) {
          return failure(setJustificationResult.error);
        }

        return success({
          questionId,
          questionType,
          justification: setJustificationResult.data,
          reponse,
        });
      } catch {
        return failure(SetPersonnalisationReponseErrorEnum.DATABASE_ERROR);
      }
    };

    return this.transactionManager.executeSingle(operation, tx);
  }
}
