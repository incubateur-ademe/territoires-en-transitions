import { Injectable, Logger } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import {
  ActionStatutCreate,
  actionStatutSchemaCreate,
  canUpdateActionStatutWithoutPermissionCheck,
  findActionById,
  getReferentielIdFromActionId,
  ScoreSnapshot,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, sql } from 'drizzle-orm';
import z from 'zod';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { GetLabellisationService } from '../labellisations/get-labellisation.service';
import { actionStatutTable } from '../models/action-statut.table';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { actionStatutCreateToActionStatutInDatabase } from './action-statut-create-to-action-statut-in-database.adapter';
import { computeAndMergeParentCascadingStatuts } from './compute-cascading-statuts.rules';
import { UpdateActionStatutHistoriqueRepository } from './update-action-statut-historique.repository';
import {
  UpdateActionStatutError,
  UpdateActionStatutErrorEnum,
} from './update-action-statut.errors';

export const upsertActionStatutsRequestSchema = z.object({
  actionStatuts: z.array(actionStatutSchemaCreate).min(1),
});

export type UpsertActionStatutsRequest = z.infer<
  typeof upsertActionStatutsRequestSchema
>;

@Injectable()
export class UpdateActionStatutService {
  private readonly logger = new Logger(UpdateActionStatutService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly snapshotsService: SnapshotsService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly updateActionStatutHistoriqueRepository: UpdateActionStatutHistoriqueRepository,
    private readonly referentielModeGuard: ReferentielModeGuard
  ) {}

  async upsertActionStatuts(
    actionStatuts: ActionStatutCreate[],
    user: AuthUser
  ): Promise<Result<ScoreSnapshot, UpdateActionStatutError>> {
    if (actionStatuts.length === 0) {
      return failure(UpdateActionStatutErrorEnum.NO_ACTION_STATUTS);
    }
    const collectiviteId = actionStatuts[0].collectiviteId;
    const referentielId = getReferentielIdFromActionId(
      actionStatuts[0].actionId
    );

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure('UNAUTHORIZED');
    }

    const modeResult = await this.referentielModeGuard.assertCanMutate(
      collectiviteId,
      referentielId
    );
    if (!modeResult.success) {
      return modeResult;
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

    const parcours =
      await this.getLabellisationService.getParcoursLabellisation({
        collectiviteId,
        referentielId,
      });
    const currentScore = await this.snapshotsService.get(
      collectiviteId,
      referentielId
    );
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

    try {
      await this.databaseService.db.transaction(async (tx) => {
        // trie les action IDs pour éviter les deadlocks lors du verrouillage de plusieurs lignes
        const sortedActionStatuts = [...allActionStatuts].sort((a, b) =>
          a.actionId.localeCompare(b.actionId)
        );
        const sortedActionIds = sortedActionStatuts.map((a) => a.actionId);

        const oldValues = await tx
          .select()
          .from(actionStatutTable)
          .where(
            and(
              eq(actionStatutTable.collectiviteId, collectiviteId),
              inArray(actionStatutTable.actionId, sortedActionIds)
            )
          )
          .orderBy(actionStatutTable.actionId)
          .for('update');

        const oldValuesMap = new Map(oldValues.map((ov) => [ov.actionId, ov]));

        const upsertedRows = await tx
          .insert(actionStatutTable)
          .values(sortedActionStatuts)
          .onConflictDoUpdate({
            target: [
              actionStatutTable.collectiviteId,
              actionStatutTable.actionId,
            ],
            set: {
              avancement: sql.raw(
                `excluded.${actionStatutTable.avancement.name}`
              ),
              avancementDetaille: sql.raw(
                `excluded.${actionStatutTable.avancementDetaille.name}`
              ),
              concerne: sql.raw(`excluded.${actionStatutTable.concerne.name}`),
              modifiedBy: sql.raw(
                `excluded.${actionStatutTable.modifiedBy.name}`
              ),
            },
          })
          .returning();

        for (const upserted of upsertedRows) {
          const oldRow = oldValuesMap.get(upserted.actionId) ?? null;
          await this.updateActionStatutHistoriqueRepository.save(
            tx,
            upserted,
            oldRow,
            user.id
          );
        }
      });
    } catch (error) {
      if (
        isErrorWithCause(error) &&
        error.cause.code ===
          PgIntegrityConstraintViolation.ForeignKeyViolation &&
        error.cause.constraint === 'action_statut_action_id_fkey'
      ) {
        const errorMessage =
          actionStatuts.length > 1
            ? `Une ou plusieurs actions n'existent pas pour le referentiel ${referentielId}`
            : `L'action ${actionStatuts[0].actionId} n'existe pas pour le referentiel ${referentielId}`;
        this.logger.warn(errorMessage);
        return failure(UpdateActionStatutErrorEnum.ACTION_NOT_FOUND);
      }

      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }

    const snapshotResult = await this.snapshotsService.computeAndUpsert(
      {
        collectiviteId,
        referentielId,
      },
      { user }
    );

    if (!snapshotResult.success) {
      return failure(
        'DATABASE_ERROR',
        snapshotResult.cause ??
          new Error('Impossible de mettre à jour le snapshot courant')
      );
    }

    return success(snapshotResult.data);
  }
}
