import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  ActionStatutCreate,
  actionStatutSchemaCreate,
  canUpdateActionStatutWithoutPermissionCheck,
  findActionById,
  getReferentielIdFromActionId,
  ScoreSnapshot,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { sql } from 'drizzle-orm';
import z from 'zod';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { GetLabellisationService } from '../labellisations/get-labellisation.service';
import { actionStatutTable } from '../models/action-statut.table';
import { SnapshotsService } from '../snapshots/snapshots.service';

export const upsertActionStatutRequestSchema = z.object({
  actionStatut: actionStatutSchemaCreate,
});

export type UpsertActionStatutRequest = z.infer<
  typeof upsertActionStatutRequestSchema
>;

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
    private readonly getLabellisationService: GetLabellisationService
  ) {}

  async upsertActionStatuts(
    actionStatuts: ActionStatutCreate[],
    user: AuthUser
  ): Promise<ScoreSnapshot> {
    if (actionStatuts.length === 0) {
      throw new BadRequestException('No action statuts to update');
    }
    const collectiviteId = actionStatuts[0].collectiviteId;
    const referentielId = getReferentielIdFromActionId(
      actionStatuts[0].actionId
    );

    // Check user access
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const seenActionIds = new Set<string>();
    for (const actionStatut of actionStatuts) {
      const key = `${actionStatut.collectiviteId}:${actionStatut.actionId}`;
      if (seenActionIds.has(key)) {
        throw new BadRequestException(
          `Action ${actionStatut.actionId} en double dans la requête`
        );
      }
      seenActionIds.add(key);
      actionStatut.modifiedBy = user.id;
      const actionReferentielId = getReferentielIdFromActionId(
        actionStatut.actionId
      );
      if (actionReferentielId !== referentielId) {
        throw new BadRequestException(
          `Action ${actionStatut.actionId} is not in the same referentiel as the other actions`
        );
      }
      if (actionStatut.collectiviteId !== collectiviteId) {
        throw new BadRequestException(
          `Action ${actionStatut.actionId} is not in the same collectivite as the other actions`
        );
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
    const canUpdateResult = canUpdateActionStatutWithoutPermissionCheck({
      parcoursStatus: parcours.status,
      actions: actionStatuts.map((actionStatut) => ({
        actionId: actionStatut.actionId,
        desactive: findActionById(
          currentScore.scoresPayload.scores,
          actionStatut.actionId
        ).score.desactive,
      })),
      isAuditeur: isAuditeur,
    });
    if (!canUpdateResult.canUpdate) {
      throw new BadRequestException(canUpdateResult.reason);
    }

    try {
      await this.databaseService.db
        .insert(actionStatutTable)
        .values(actionStatuts)
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
        throw new NotFoundException(errorMessage);
      }

      this.logger.error(error);
      throw error;
    }

    return this.snapshotsService.computeAndUpsert({
      collectiviteId,
      referentielId,
      user,
    });
  }
}
