import { Injectable, Logger } from '@nestjs/common';
import { FicheActionRepository } from '@tet/backend/plans/fiches/fiche-action.repository';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ShareFicheService } from '@tet/backend/plans/fiches/share-fiches/share-fiche.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { FicheWithRelations } from '@tet/domain/plans';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { isNil } from 'es-toolkit';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { NotifyPiloteService } from '../notify-pilote/notify-pilote.service';
import { UpdateFicheError, UpdateFicheErrorEnum } from './update-fiche.errors';
import { UpdateFicheInput } from './update-fiche.input';
import { UpdateFicheResult } from './update-fiche.result';

@Injectable()
export default class UpdateFicheService {
  private readonly logger = new Logger(UpdateFicheService.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly ficheActionListService: ListFichesService,
    private readonly fichePermissionService: FicheActionPermissionsService,
    private readonly shareFicheService: ShareFicheService,
    private readonly notificationsFicheService: NotifyPiloteService,
    private readonly ficheActionRepository: FicheActionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly permissionService: PermissionService
  ) {}

  private async assertMesuresWritable(
    ficheId: number,
    mesures: Array<{ id: string }>,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<UpdateFicheResult<void>> {
    const ficheRow = await this.fichePermissionService.getFicheFromId(
      ficheId,
      tx
    );
    if (!ficheRow) {
      return failure(UpdateFicheErrorEnum.FICHE_NOT_FOUND);
    }

    const existingFiche = await this.ficheActionListService.getFicheById(
      ficheId,
      false,
      user,
      tx
    );
    if (!existingFiche.success) {
      return failure(UpdateFicheErrorEnum.FICHE_NOT_FOUND);
    }

    const oldActionIds = (existingFiche.data.mesures ?? []).map((m) => m.id);
    const newActionIds = mesures.map((m) => m.id);
    const affectedActionIds = [...new Set([...oldActionIds, ...newActionIds])];

    const referentielIds = new Set<ReferentielId>();
    for (const actionId of affectedActionIds) {
      try {
        referentielIds.add(getReferentielIdFromActionId(actionId));
      } catch {
        return failure(UpdateFicheErrorEnum.INVALID_ACTION_ID);
      }
    }

    for (const referentielId of referentielIds) {
      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['REFERENTIELS.MUTATE'],
        ResourceType.REFERENTIEL,
        { collectiviteId: ficheRow.collectiviteId, referentielId },
        tx
      );
      if (!permissionResult.success) {
        return failure(permissionResult.error);
      }
    }

    return success(undefined);
  }

  async updateFiche({
    ficheId,
    ficheFields,
    isNotificationEnabled,
    user,
    tx,
  }: {
    ficheId: number;
    ficheFields: UpdateFicheInput;
    isNotificationEnabled?: boolean;
    user: AuthenticatedUser;
    tx?: Transaction;
  }): Promise<UpdateFicheResult<FicheWithRelations, UpdateFicheError>> {
    await this.fichePermissionService.canWriteFiche(ficheId, user, tx);
    this.logger.log(`Mise à jour de la fiche action dont l'id est ${ficheId}`);

    if (ficheFields.mesures !== undefined) {
      const mesuresGuardResult = await this.assertMesuresWritable(
        ficheId,
        ficheFields.mesures ?? [],
        user,
        tx
      );
      if (!mesuresGuardResult.success) {
        return mesuresGuardResult;
      }
    }

    if (!isNil(ficheFields.parentId)) {
      if (ficheFields.parentId === ficheId) {
        return failure(UpdateFicheErrorEnum.SELF_REFERENCE);
      }

      const resultGetParentFiche =
        await this.ficheActionListService.getFicheById(
          ficheFields.parentId,
          false,
          user,
          tx
        );
      if (!resultGetParentFiche.success) {
        this.logger.error(resultGetParentFiche.error);
        return failure(UpdateFicheErrorEnum.PARENT_NOT_FOUND);
      }

      // Anti-escalade : la sous-action doit appartenir à la même collectivité
      // que sa fiche parente. Sans ce check, un utilisateur ayant write sur la
      // fiche et read sur une autre collectivité pourrait y rattacher la fiche.
      const ficheRow = await this.fichePermissionService.getFicheFromId(
        ficheId,
        tx
      );
      if (!ficheRow) {
        return failure(UpdateFicheErrorEnum.FICHE_NOT_FOUND);
      }
      if (
        resultGetParentFiche.data.collectiviteId !== ficheRow.collectiviteId
      ) {
        return failure(UpdateFicheErrorEnum.PARENT_COLLECTIVITE_MISMATCH);
      }
    }

    const txResult = await this.transactionManager.executeSingle<
      FicheWithRelations,
      UpdateFicheError
    >(
      async (
        transaction
      ): Promise<Result<FicheWithRelations, UpdateFicheError>> => {
        const resultGetExistingFiche =
          await this.ficheActionListService.getFicheById(
            ficheId,
            false,
            user,
            transaction
          );
        if (!resultGetExistingFiche.success) {
          this.logger.error(resultGetExistingFiche.error);
          return failure(UpdateFicheErrorEnum.FICHE_NOT_FOUND);
        }
        const existingFicheAction = resultGetExistingFiche.data;

        const applyResult = await this.ficheActionRepository.applyUpdate({
          ficheId,
          ficheFields,
          existingFiche: existingFicheAction,
          user,
          tx: transaction,
        });
        if (!applyResult.success) return applyResult;

        // Le partage cross-collectivité dépasse l'aggregate FicheAction : on
        // l'orchestre depuis le service plutôt que dans la couche d'écriture.
        if (ficheFields.sharedWithCollectivites !== undefined) {
          const collectiviteIds =
            ficheFields.sharedWithCollectivites?.map((sharing) => sharing.id) ??
            [];
          await this.shareFicheService.shareFiche(
            existingFicheAction,
            collectiviteIds,
            user.id,
            transaction
          );
        }

        const updatedFiche = await this.ficheActionListService.getFicheById(
          ficheId,
          true,
          user,
          transaction
        );
        if (!updatedFiche.success) {
          return failure(UpdateFicheErrorEnum.FICHE_NOT_FOUND);
        }

        if (isNotificationEnabled ?? true) {
          await this.notificationsFicheService.upsertPiloteNotificationsBulk({
            fichesPairs: [
              {
                updatedFiche: updatedFiche.data,
                previousFiche: existingFicheAction,
              },
            ],
            user,
            tx: transaction,
          });
        }

        return success(updatedFiche.data);
      },
      tx
    );

    if (!txResult.success) return txResult;
    const updatedFiche = txResult.data;

    try {
      await this.webhookService.sendWebhookNotification(
        ApplicationSousScopesEnum.FICHES,
        `${ficheId}`,
        updatedFiche
      );
    } catch (webhookError) {
      this.logger.error(
        `Webhook notification failed for fiche ${ficheId}`,
        webhookError instanceof Error ? webhookError.stack : webhookError
      );
    }

    return success(updatedFiche);
  }
}
