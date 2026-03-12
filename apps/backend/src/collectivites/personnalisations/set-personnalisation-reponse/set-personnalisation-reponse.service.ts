import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  PersonnalisationReponse,
  PersonnalisationReponseValue,
  QuestionType,
} from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ListPersonnalisationReponsesService } from '../list-personnalisation-reponses/list-personnalisation-reponses.service';
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
    private readonly setPersonnalisationReponseRepository: SetPersonnalisationReponseRepository,
    private readonly listPersonnalisationReponsesService: ListPersonnalisationReponsesService
  ) {}

  async setPersonnalisationReponse(
    input: SetPersonnalisationReponseInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<PersonnalisationReponse, SetPersonnalisationReponseError>> {
    const {
      collectiviteId,
      questionId,
      justification: newJustificationValue,
      reponse: newReponseValue,
    } = input;

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

        // charge la réponse actuelle
        const currentReponseResult =
          await this.listPersonnalisationReponsesService.listPersonnalisationReponses(
            {
              collectiviteId,
              questionIds: [questionId],
              withEmptyReponse: true,
            },
            user,
            transaction
          );
        if (!currentReponseResult.success) {
          return currentReponseResult;
        }
        const currentReponse = currentReponseResult.data[0];
        if (!currentReponse) {
          return failure(
            SetPersonnalisationReponseErrorEnum.QUESTION_NOT_FOUND
          );
        }

        // insère/màj la réponse si elle diffère de la réponse existante
        let newReponse: {
          questionType: QuestionType;
          reponse: PersonnalisationReponseValue;
        } | null = null;
        if (currentReponse.reponse !== newReponseValue) {
          const setReponseResult =
            await this.setPersonnalisationReponseRepository.setReponse(
              input,
              transaction
            );
          if (!setReponseResult.success) {
            return failure(setReponseResult.error);
          }
          newReponse = setReponseResult.data;
        }

        // insère/màj la justification si elle diffère de la justification existante
        let newJustification;
        if (currentReponse.justification !== newJustificationValue) {
          const setJustificationResult =
            await this.setPersonnalisationReponseRepository.setJustification(
              input,
              user,
              transaction
            );
          if (!setJustificationResult.success) {
            return failure(setJustificationResult.error);
          }
          newJustification = setJustificationResult.data;
        }

        const { questionType, reponse } = newReponse || currentReponse;
        return success({
          questionId,
          questionType,
          justification:
            newJustification !== undefined
              ? newJustification
              : currentReponse.justification,
          reponse,
        });
      } catch {
        return failure(SetPersonnalisationReponseErrorEnum.DATABASE_ERROR);
      }
    };

    return this.transactionManager.executeSingle(operation, tx);
  }
}
