import { Injectable } from '@nestjs/common';
import { GetActionService } from '@tet/backend/referentiels/get-action/get-action.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import {
  UpdateActionFichesError,
  UpdateActionFichesErrorEnum,
} from './fiche-action-link.errors';
import { FicheActionLinkRepository } from './fiche-action-link.repository';
import { validateFichesInCollectivite } from './validate-fiches-in-collectivite';

@Injectable()
export class FicheActionLinkService {
  constructor(
    private readonly repo: FicheActionLinkRepository,
    private readonly getActionService: GetActionService,
    private readonly permissionService: PermissionService,
    private readonly fichePermissionService: FicheActionPermissionsService,
    private readonly transactionManager: TransactionManager
  ) {}

  async updateLinkedFiches({
    actionId,
    collectiviteId,
    ficheIds,
    user,
    tx,
  }: {
    actionId: string;
    collectiviteId: number;
    ficheIds: number[];
    user: AuthenticatedUser;
    tx?: Transaction;
  }): Promise<Result<undefined, UpdateActionFichesError>> {
    const action = await this.getActionService.findById(actionId, tx);
    if (!action) {
      return failure(UpdateActionFichesErrorEnum.ACTION_NOT_FOUND);
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.UPDATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true,
      tx
    );
    if (!isAllowed) {
      return failure(UpdateActionFichesErrorEnum.UNAUTHORIZED);
    }

    if (ficheIds.length > 0) {
      const foundFiches = await this.repo.findFichesByIds(ficheIds, tx);
      const scopeCheck = validateFichesInCollectivite(
        foundFiches,
        ficheIds,
        collectiviteId
      );
      if (!scopeCheck.success) {
        return failure(
          scopeCheck.error.code === 'FICHE_NOT_FOUND'
            ? UpdateActionFichesErrorEnum.FICHE_NOT_FOUND
            : UpdateActionFichesErrorEnum.FICHE_COLLECTIVITE_MISMATCH
        );
      }

      for (const ficheId of ficheIds) {
        const accessMode = await this.fichePermissionService.canWriteFiche(
          ficheId,
          user,
          tx
        );
        if (accessMode === null) {
          return failure(UpdateActionFichesErrorEnum.UNAUTHORIZED);
        }
      }
    }

    return this.transactionManager.executeSingle<
      undefined,
      UpdateActionFichesError
    >(async (innerTx) => {
      await this.repo.replaceLinksForActionInCollectivite(
        { actionId, collectiviteId, ficheIds },
        innerTx
      );
      return success(undefined);
    }, tx);
  }
}
