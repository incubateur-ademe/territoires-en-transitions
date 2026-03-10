import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  PersonnalisationReponse,
} from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ListPersonnalisationReponsesService } from '../list-personnalisation-reponses/list-personnalisation-reponses.service';
import {
  SetPersonnalisationReponseError,
  SetPersonnalisationReponseErrorEnum,
} from './set-personnalisation-reponse.errors';
import { SetPersonnalisationReponseHistoriqueRepository } from './set-personnalisation-reponse-historique.repository';
import { SetPersonnalisationReponseInput } from './set-personnalisation-reponse.input';
import {
  SetPersonnalisationReponseRepository,
  SetPersonnalisationReponseWriteData,
} from './set-personnalisation-reponse.repository';

export type SetPersonnalisationReponseSavedEvent = {
  collectiviteId: number;
  user: AuthenticatedUser;
} & PersonnalisationReponse;

@Injectable()
export class SetPersonnalisationReponseService {
  private readonly logger = new Logger(SetPersonnalisationReponseService.name);
  private readonly responseListeners: Array<
    (event: SetPersonnalisationReponseSavedEvent) => Promise<void>
  > = [];

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissionService: PermissionService,
    private readonly setPersonnalisationReponseRepository: SetPersonnalisationReponseRepository,
    private readonly listPersonnalisationReponsesService: ListPersonnalisationReponsesService,
    private readonly setPersonnalisationReponseHistoriqueRepository: SetPersonnalisationReponseHistoriqueRepository
  ) {}

  registerResponseListener(
    listener: (event: SetPersonnalisationReponseSavedEvent) => Promise<void>
  ) {
    // Keep it simple: listeners are stored for the lifetime of the service instance
    // (Nest providers are singletons by default).
    this.responseListeners.push(listener);
  }

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

    let shouldTriggerResponseListeners = false;
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
        let newReponse: SetPersonnalisationReponseWriteData | null = null;
        const responseChanged = currentReponse.reponse !== newReponseValue;
        if (responseChanged) {
          const setReponseResult =
            await this.setPersonnalisationReponseRepository.setReponse(
              input,
              transaction
            );
          if (!setReponseResult.success) {
            return failure(setReponseResult.error);
          }
          newReponse = setReponseResult.data;

          if (setReponseResult.data.questionType === 'binaire') {
            await this.setPersonnalisationReponseHistoriqueRepository.saveReponseBinaire(
              transaction,
              setReponseResult.data.newRow,
              setReponseResult.data.oldRow,
              user.id
            );
          } else if (setReponseResult.data.questionType === 'choix') {
            await this.setPersonnalisationReponseHistoriqueRepository.saveReponseChoix(
              transaction,
              setReponseResult.data.newRow,
              setReponseResult.data.oldRow,
              user.id
            );
          } else if (setReponseResult.data.questionType === 'proportion') {
            await this.setPersonnalisationReponseHistoriqueRepository.saveReponseProportion(
              transaction,
              setReponseResult.data.newRow,
              setReponseResult.data.oldRow,
              user.id
            );
          }
        }
        shouldTriggerResponseListeners = responseChanged;

        // insère/màj la justification si elle diffère de la justification existante
        let newJustification;
        const justificationWillBeWritten =
          newJustificationValue !== undefined &&
          currentReponse.justification !== newJustificationValue;
        if (justificationWillBeWritten) {
          const setJustificationResult =
            await this.setPersonnalisationReponseRepository.setJustification(
              input,
              user,
              transaction
            );
          if (!setJustificationResult.success) {
            return failure(setJustificationResult.error);
          }
          if (setJustificationResult.data) {
            await this.setPersonnalisationReponseHistoriqueRepository.saveJustification(
              transaction,
              setJustificationResult.data.newRow,
              setJustificationResult.data.oldRow,
              user.id
            );
            newJustification = setJustificationResult.data.justification;
          }
        }
        shouldTriggerResponseListeners =
          shouldTriggerResponseListeners || justificationWillBeWritten;

        const { questionType, reponse } = newReponse || currentReponse;
        const justification =
          newJustification !== undefined
            ? newJustification
            : currentReponse.justification;

        return success({
          questionId,
          questionType,
          justification,
          reponse,
        } as PersonnalisationReponse);
      } catch {
        return failure(SetPersonnalisationReponseErrorEnum.DATABASE_ERROR);
      }
    };

    const result = await this.transactionManager.executeSingle(operation, tx);

    // Trigger recomputation only after the transaction finished successfully.
    if (
      result.success &&
      shouldTriggerResponseListeners &&
      this.responseListeners.length > 0
    ) {
      this.logger.log(
        `Triggering ${this.responseListeners.length} response listeners for collectivite ${collectiviteId} and question ${questionId}`
      );
      const event: SetPersonnalisationReponseSavedEvent = {
        collectiviteId,
        user,
        ...result.data,
      };

      // Await listeners so downstream logic/tests can deterministically observe updates.
      await Promise.all(
        this.responseListeners.map((listener) => listener(event))
      );
    }

    return result;
  }
}
