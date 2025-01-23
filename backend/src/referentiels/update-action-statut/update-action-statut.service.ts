import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { PostgresError } from 'postgres';
import z from 'zod';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { getErrorWithCode } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import ReferentielsScoringService from '../compute-score/referentiels-scoring.service';
import {
  actionStatutSchemaInsert,
  actionStatutTable,
} from '../models/action-statut.table';
import { ComputeScoreMode } from '../models/compute-scores-mode.enum';
import { GetReferentielScoresRequestType } from '../models/get-referentiel-scores.request';
import { getReferentielIdFromActionId } from '../referentiels.utils';
import ReferentielsService from '../services/referentiels.service';

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
    private readonly referentielService: ReferentielsService,
    private readonly referentielScoringService: ReferentielsScoringService
  ) {}

  async upsertActionStatut(
    request: UpsertActionStatutRequest,
    user: AuthenticatedUser
  ) {
    // Check user access
    await this.permissionService.isAllowed(
      user,
      PermissionOperation.REFERENTIELS_EDITION,
      ResourceType.COLLECTIVITE,
      request.actionStatut.collectiviteId
    );

    const referentielId = getReferentielIdFromActionId(
      request.actionStatut.actionId
    );

    request.actionStatut.modifiedBy = user?.id;
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

        const postgresError = error as PostgresError;
        if (postgresError.constraint_name === 'action_statut_action_id_fkey') {
          throw new NotFoundException(
            `L'action ${request.actionStatut.actionId} n'existe pas pour le referentiel ${referentielId}`
          );
        }
      }
      throw error;
    }

    // TODO: support for different response format depending on the front
    const parameters: GetReferentielScoresRequestType = {
      snapshot: true,
      snapshotForceUpdate: true,
      mode: ComputeScoreMode.RECALCUL,
    };
    // TODO: once the route is used by the front, we need to remove the trigger
    return this.referentielScoringService.computeScoreForCollectivite(
      referentielId,
      request.actionStatut.collectiviteId,
      parameters,
      undefined // No need to check user access, it has already been done
    );
  }
}
