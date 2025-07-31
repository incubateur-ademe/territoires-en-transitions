import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import NodePostgresError from '@/backend/utils/node-postgres-error.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import z from 'zod';
import { getErrorWithCode } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import ScoresService from '../compute-score/scores.service';
import {
  actionStatutSchemaInsert,
  actionStatutTable,
} from '../models/action-statut.table';
import { getReferentielIdFromActionId } from '../referentiels.utils';
import { Snapshot } from '../snapshots/snapshot.table';
import { SnapshotsService } from '../snapshots/snapshots.service';

export const upsertActionStatutRequestSchema = z.object({
  actionStatut: actionStatutSchemaInsert,
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
    private readonly scoresService: ScoresService,
    private readonly snapshotsService: SnapshotsService
  ) {}

  async upsertActionStatut(
    request: UpsertActionStatutRequest,
    user: AuthUser
  ): Promise<Snapshot> {
    // Check user access
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.EDITION'],
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
      const errorWithCode = getErrorWithCode(error);
      if (
        errorWithCode.code ===
        PgIntegrityConstraintViolation.ForeignKeyViolation
      ) {
        this.logger.error(error);

        const nodePostgresError = error as NodePostgresError;
        if (nodePostgresError.constraint === 'action_statut_action_id_fkey') {
          throw new NotFoundException(
            `L'action ${request.actionStatut.actionId} n'existe pas pour le referentiel ${referentielId}`
          );
        }
      }
      throw error;
    }

    return this.snapshotsService.computeAndUpsert({
      collectiviteId: request.actionStatut.collectiviteId,
      referentielId,
      user,
    });
  }
}
