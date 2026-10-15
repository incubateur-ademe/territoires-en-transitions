import { Injectable } from '@nestjs/common';
import { CollectiviteReferentielModeService } from '@tet/backend/collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { GetActionService } from '@tet/backend/referentiels/get-action/get-action.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
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
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService,
    private readonly fichePermissionService: FicheActionPermissionsService,
    private readonly permissionService: PermissionService,
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

    let referentielId: ReferentielId;
    try {
      referentielId = getReferentielIdFromActionId(actionId);
    } catch {
      return failure(UpdateActionFichesErrorEnum.INVALID_ACTION_ID);
    }

    // Seul un utilisateur pouvant modifier des fiches de la collectivité
    // (toutes, ou celles qu'il pilote) peut gérer ces liens : on ne révèle
    // rien des liens ni des fiches aux autres.
    const canEditSomeFiches = await this.canEditFichesOfCollectivite(
      user,
      collectiviteId,
      tx
    );
    if (!canEditSomeFiches) {
      return failure(UpdateActionFichesErrorEnum.UNAUTHORIZED);
    }

    return this.transactionManager.executeSingle<
      undefined,
      UpdateActionFichesError
    >(async (innerTx) => {
      // Le diff, les contrôles et l'écriture se font sous le même verrou pour
      // ne jamais modifier un lien qui n'a pas été contrôlé.
      await this.repo.lockActionLinks(actionId, innerTx);

      const linkedFicheIds = new Set(
        await this.repo.listFicheIdsLinkedToAction(
          { actionId, collectiviteId },
          innerTx
        )
      );
      const newFicheIds = new Set(ficheIds);
      const addedFicheIds = [...newFicheIds].filter(
        (id) => !linkedFicheIds.has(id)
      );
      const removedFicheIds = [...linkedFicheIds].filter(
        (id) => !newFicheIds.has(id)
      );

      if (addedFicheIds.length === 0 && removedFicheIds.length === 0) {
        return success(undefined);
      }

      // Lier ou délier une mesure revient à modifier la fiche : le droit
      // d'écriture sur chaque fiche dont le lien change suffit.
      for (const ficheId of [...addedFicheIds, ...removedFicheIds]) {
        const accessMode = await this.fichePermissionService.canWriteFiche(
          ficheId,
          user,
          innerTx,
          true
        );
        if (accessMode === null) {
          return failure(UpdateActionFichesErrorEnum.UNAUTHORIZED);
        }
      }

      if (addedFicheIds.length > 0) {
        const foundFiches = await this.repo.findFichesByIds(
          addedFicheIds,
          innerTx
        );
        const scopeCheck = validateFichesInCollectivite(
          foundFiches,
          addedFicheIds,
          collectiviteId
        );
        if (!scopeCheck.success) {
          return failure(
            scopeCheck.error.code === 'FICHE_NOT_FOUND'
              ? UpdateActionFichesErrorEnum.FICHE_NOT_FOUND
              : UpdateActionFichesErrorEnum.FICHE_COLLECTIVITE_MISMATCH
          );
        }

        // Délier reste possible sur un référentiel archivé ou en lecture
        // seule ; seul l'ajout exige un référentiel modifiable.
        const modeResult =
          await this.collectiviteReferentielModeService.assertReferentielsWritable(
            collectiviteId,
            [referentielId],
            innerTx
          );
        if (!modeResult.success) {
          return modeResult;
        }
      }

      await this.repo.updateLinksForAction(
        { actionId, addedFicheIds, removedFicheIds },
        innerTx
      );
      return success(undefined);
    }, tx);
  }

  private async canEditFichesOfCollectivite(
    user: AuthenticatedUser,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    for (const operation of [
      PermissionOperationEnum['PLANS.FICHES.UPDATE'],
      PermissionOperationEnum['PLANS.FICHES.UPDATE_PILOTED_BY_ME'],
    ]) {
      const result = await this.permissionService.isAllowed(
        user,
        operation,
        ResourceType.COLLECTIVITE,
        { collectiviteId },
        tx
      );
      if (result.success) {
        return true;
      }
    }
    return false;
  }
}
