import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  ActionStatutCreate,
  canUpdateActionStatutWithoutPermissionCheck,
  findActionById,
  getReferentielIdFromActionId,
  ScoreSnapshot,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { GetLabellisationService } from '../labellisations/get-labellisation.service';
import { mapSnapshotsError } from '../snapshots/snapshots.errors';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { actionStatutCreateToActionStatutInDatabase } from './action-statut-create-to-action-statut-in-database.adapter';
import { computeAndMergeParentCascadingStatuts } from './compute-cascading-statuts.rules';
import { UpdateActionStatutHistoriqueRepository } from './update-action-statut-historique.repository';
import {
  UpdateActionStatutError,
  UpdateActionStatutErrorEnum,
} from './update-action-statut.errors';
import { UpdateActionStatutRepository } from './update-action-statut.repository';

@Injectable()
export class UpdateActionStatutService {
  private readonly logger = new Logger(UpdateActionStatutService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly snapshotsService: SnapshotsService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly transactionManager: TransactionManager,
    private readonly updateActionStatutRepository: UpdateActionStatutRepository,
    private readonly updateActionStatutHistoriqueRepository: UpdateActionStatutHistoriqueRepository
  ) {}

  /**
   * Écrit les statuts puis recalcule le snapshot courant, qui est renvoyé.
   *
   * Le snapshot est recalculé après le commit : son calcul lit la base hors
   * transaction et ne verrait pas les statuts non encore committés.
   */
  async upsertActionStatuts(
    actionStatuts: ActionStatutCreate[],
    user: AuthenticatedUser
  ): Promise<Result<ScoreSnapshot, UpdateActionStatutError>> {
    if (actionStatuts.length === 0) {
      return failure(UpdateActionStatutErrorEnum.NO_ACTION_STATUTS);
    }
    const collectiviteId = actionStatuts[0].collectiviteId;
    const referentielId = getReferentielIdFromActionId(
      actionStatuts[0].actionId
    );

    const writeResult = await this.upsertActionStatutsWithoutSnapshot(
      actionStatuts,
      { user }
    );
    if (!writeResult.success) {
      return failure(writeResult.error, writeResult.cause);
    }

    const snapshotResult = await this.snapshotsService.computeAndUpsert(
      {
        collectiviteId,
        referentielId,
      },
      { user }
    );

    if (!snapshotResult.success) {
      return mapSnapshotsError(snapshotResult, {
        snapshotConflict: UpdateActionStatutErrorEnum.SNAPSHOT_UPDATE_FAILED,
        snapshotSaveFailed: UpdateActionStatutErrorEnum.SNAPSHOT_UPDATE_FAILED,
        defaultError: 'DATABASE_ERROR',
      });
    }

    return success(snapshotResult.data);
  }

  /**
   * Valide puis écrit les statuts, sans toucher au snapshot : à l'appelant de
   * le recalculer une fois la transaction committée.
   *
   * Accepte une transaction externe, pour composer cette écriture avec
   * d'autres. Dans ce cas, conformément au `TransactionManager`, un échec est
   * relancé plutôt que renvoyé, afin que la transaction de l'appelant soit
   * annulée.
   */
  async upsertActionStatutsWithoutSnapshot(
    actionStatuts: ActionStatutCreate[],
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, UpdateActionStatutError>> {
    if (actionStatuts.length === 0) {
      return failure(UpdateActionStatutErrorEnum.NO_ACTION_STATUTS);
    }
    const collectiviteId = actionStatuts[0].collectiviteId;
    const referentielId = getReferentielIdFromActionId(
      actionStatuts[0].actionId
    );

    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.REFERENTIEL,
      { collectiviteId, referentielId }
    );

    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    const seenActionIds = new Set<string>();
    for (const actionStatut of actionStatuts) {
      const key = `${actionStatut.collectiviteId}:${actionStatut.actionId}`;
      if (seenActionIds.has(key)) {
        return failure(UpdateActionStatutErrorEnum.DUPLICATE_ACTION);
      }
      seenActionIds.add(key);
      const actionReferentielId = getReferentielIdFromActionId(
        actionStatut.actionId
      );
      if (actionReferentielId !== referentielId) {
        return failure(UpdateActionStatutErrorEnum.MIXED_REFERENTIEL_ACTIONS);
      }
      if (actionStatut.collectiviteId !== collectiviteId) {
        return failure(UpdateActionStatutErrorEnum.MIXED_COLLECTIVITE_ACTIONS);
      }
    }

    const parcoursResult =
      await this.getLabellisationService.getParcoursLabellisation({
        collectiviteId,
        referentielId,
      });
    if (!parcoursResult.success) {
      return failure(
        'DATABASE_ERROR',
        parcoursResult.cause ??
          new Error('Impossible de récupérer le parcours de labellisation')
      );
    }
    const parcours = parcoursResult.data;
    const currentScoreResult = await this.snapshotsService.get(
      collectiviteId,
      referentielId,
      undefined,
      { user }
    );
    if (!currentScoreResult.success) {
      return mapSnapshotsError(currentScoreResult, {
        snapshotNotFound: UpdateActionStatutErrorEnum.ACTION_NOT_IN_SNAPSHOT,
        defaultError: 'DATABASE_ERROR',
      });
    }
    const currentScore = currentScoreResult.data;
    const isAuditeur = parcours.auditeurs.some(
      (auditeur) => auditeur.userId === user.id
    );

    const actionsWithDesactive: { actionId: string; desactive: boolean }[] = [];
    for (const actionStatut of actionStatuts) {
      try {
        actionsWithDesactive.push({
          actionId: actionStatut.actionId,
          desactive: findActionById(
            currentScore.scoresPayload.scores,
            actionStatut.actionId
          ).score.desactive,
        });
      } catch {
        return failure(UpdateActionStatutErrorEnum.ACTION_NOT_IN_SNAPSHOT);
      }
    }

    const canUpdateResult = canUpdateActionStatutWithoutPermissionCheck({
      parcoursStatus: parcours.status,
      actions: actionsWithDesactive,
      isAuditeur: isAuditeur,
    });
    if (!canUpdateResult.canUpdate) {
      return failure(canUpdateResult.reason);
    }

    const allActionStatuts = computeAndMergeParentCascadingStatuts(
      actionStatuts,
      currentScore.scoresPayload.scores,
      collectiviteId
    ).map((actionStatut) => ({
      collectiviteId: actionStatut.collectiviteId,
      actionId: actionStatut.actionId,
      modifiedBy: user.id,
      modifiedAt: SQL_CURRENT_TIMESTAMP,

      ...actionStatutCreateToActionStatutInDatabase(actionStatut),
    }));

    return this.transactionManager.executeSingle<void, UpdateActionStatutError>(
      async (transaction) => {
        const upsertResult =
          await this.updateActionStatutRepository.upsertStatuts(
            collectiviteId,
            allActionStatuts,
            transaction
          );
        if (!upsertResult.success) {
          if (
            upsertResult.error === UpdateActionStatutErrorEnum.ACTION_NOT_FOUND
          ) {
            this.logger.warn(
              actionStatuts.length > 1
                ? `Une ou plusieurs actions n'existent pas pour le referentiel ${referentielId}`
                : `L'action ${actionStatuts[0].actionId} n'existe pas pour le referentiel ${referentielId}`
            );
          }
          return failure(upsertResult.error, upsertResult.cause);
        }

        try {
          for (const { current, previous } of upsertResult.data) {
            await this.updateActionStatutHistoriqueRepository.save(
              transaction,
              current,
              previous,
              user.id
            );
          }
        } catch (error) {
          this.logger.error(error);
          return failure(
            'DATABASE_ERROR',
            error instanceof Error ? error : new Error(getErrorMessage(error))
          );
        }

        return success(undefined);
      },
      tx
    );
  }
}
