import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  ActionDeReferenceId,
  UpdateActionDeReferenceInput,
  UpdateActionDeReferenceOutput,
} from '@tet/domain/shared';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ActionDeReferenceFicheRepository } from '../action-de-reference-fiche.repository';
import {
  ActionsDeReferenceErrorEnum,
  LinkableFicheIdsError,
  ListFicheParentsError,
  ReplaceFichesError,
  UpdateActionDeReferenceError,
} from '../actions-de-reference.errors';
import { ActionsDeReferenceRepository } from '../actions-de-reference.repository';
import { toLinkableFicheIds } from './update-action-de-reference.rules';

type UpdateActionDeReference = (
  input: UpdateActionDeReferenceInput,
  secondArg: ServiceSecondArg
) => Promise<
  Result<UpdateActionDeReferenceOutput, UpdateActionDeReferenceError>
>;

@Injectable()
export class UpdateActionDeReferenceService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly permissions: PermissionService,
    private readonly repository: ActionsDeReferenceRepository,
    private readonly fichesRepository: ActionDeReferenceFicheRepository
  ) {}

  updateAction: UpdateActionDeReference = (
    { id, ficheIds, ...changes },
    { user, tx }
  ) =>
    this.transactionManager.executeSingle(async (transaction) => {
      const permissionResult = await this.permissions.isAllowed(
        user,
        PermissionOperationEnum['SHARED.ACTIONS-DE-REFERENCE.MUTATE'],
        ResourceType.PLATEFORME,
        null,
        transaction
      );
      if (!permissionResult.success) {
        return failure(ActionsDeReferenceErrorEnum.UNAUTHORIZED);
      }

      const updateResult = await this.repository.update({
        id,
        changes,
        tx: transaction,
      });
      if (!updateResult.success) {
        return updateResult;
      }
      if (ficheIds === undefined) {
        return updateResult;
      }

      const linkResult = await this.linkFiches({
        actionDeReferenceId: id,
        requestedFicheIds: ficheIds,
        tx: transaction,
      });
      if (!linkResult.success) {
        return failure(linkResult.error);
      }
      return updateResult;
    }, tx);

  private async linkFiches({
    actionDeReferenceId,
    requestedFicheIds,
    tx,
  }: {
    actionDeReferenceId: ActionDeReferenceId;
    requestedFicheIds: readonly number[];
    tx: Transaction;
  }): Promise<
    Result<
      void,
      ListFicheParentsError | LinkableFicheIdsError | ReplaceFichesError
    >
  > {
    const hasNoFicheToLink = requestedFicheIds.length === 0;
    if (hasNoFicheToLink) {
      return this.fichesRepository.replaceFiches({
        actionDeReferenceId,
        ficheIds: [],
        tx,
      });
    }

    const parentsResult = await this.fichesRepository.listFicheParents({
      ficheIds: requestedFicheIds,
      tx,
    });
    if (!parentsResult.success) {
      return failure(parentsResult.error);
    }

    const linkableResult = toLinkableFicheIds({
      requestedFicheIds,
      existingFiches: parentsResult.data,
    });
    if (!linkableResult.success) {
      return failure(linkableResult.error);
    }

    return this.fichesRepository.replaceFiches({
      actionDeReferenceId,
      ficheIds: linkableResult.data,
      tx,
    });
  }
}
