import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  actionStatutSchemaCreate,
  getReferentielIdFromActionId,
  ScoreSnapshot,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum } from '@tet/domain/users';
import { sql } from 'drizzle-orm';
import z from 'zod';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { actionStatutTable } from '../models/action-statut.table';
import { SnapshotsService } from '../snapshots/snapshots.service';

export const upsertActionStatutRequestSchema = z.object({
  actionStatut: actionStatutSchemaCreate,
});

export type UpsertActionStatutRequest = z.infer<
  typeof upsertActionStatutRequestSchema
>;

@Injectable()
export class UpdateActionStatutService {
  private readonly logger = new Logger(UpdateActionStatutService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly snapshotsService: SnapshotsService
  ) {}

  async upsertActionStatut(
    request: UpsertActionStatutRequest,
    user: AuthUser
  ): Promise<ScoreSnapshot> {
    // Check user access
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      request.actionStatut.collectiviteId
    );

    const referentielId = getReferentielIdFromActionId(
      request.actionStatut.actionId
    );

    request.actionStatut.modifiedBy = user.id;
    try {
      await this.databaseService.db
        .insert(actionStatutTable)
        .values(request.actionStatut)
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
        const errorMessage = `L'action ${request.actionStatut.actionId} n'existe pas pour le referentiel ${referentielId}`;
        this.logger.warn(errorMessage);
        throw new NotFoundException(errorMessage);
      }

      this.logger.error(error);
      throw error;
    }

    return this.snapshotsService.computeAndUpsert({
      collectiviteId: request.actionStatut.collectiviteId,
      referentielId,
      user,
    });
  }
}
