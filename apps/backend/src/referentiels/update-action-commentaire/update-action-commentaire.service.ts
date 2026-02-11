import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import {
  ActionCommentaire,
  ActionCommentaireCreate,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { sql } from 'drizzle-orm';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { actionCommentaireTable } from '../models/action-commentaire.table';
import { SnapshotsService } from '../snapshots/snapshots.service';
import {
  UpdateActionCommentaireError,
  UpdateActionCommentaireErrorEnum,
} from './update-action-commentaire.errors';

@Injectable()
export class UpdateActionCommentaireService {
  private readonly logger = new Logger(UpdateActionCommentaireService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly snapshotsService: SnapshotsService
  ) {}

  async updateCommentaire(
    input: ActionCommentaireCreate,
    user: AuthUser
  ): Promise<Result<ActionCommentaire, UpdateActionCommentaireError>> {
    const { collectiviteId, actionId, commentaire } = input;
    const referentielId = getReferentielIdFromActionId(actionId);

    const isAllowed = await this.permissionService.isAllowed(
      user,
      'referentiels.mutate',
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!isAllowed) {
      return failure('UNAUTHORIZED');
    }

    try {
      const insertedActionCommentaire = await this.databaseService.db
        .insert(actionCommentaireTable)
        .values({
          collectiviteId,
          actionId,
          commentaire,
          modifiedBy: user.id,
        })
        .onConflictDoUpdate({
          target: [
            actionCommentaireTable.collectiviteId,
            actionCommentaireTable.actionId,
          ],
          set: {
            commentaire: sql.raw(
              `excluded.${actionCommentaireTable.commentaire.name}`
            ),
            modifiedBy: sql.raw(
              `excluded.${actionCommentaireTable.modifiedBy.name}`
            ),
          },
        })
        .returning()
        .then((result) => result[0]);

      await this.snapshotsService.computeAndUpsert({
        collectiviteId,
        referentielId,
        user,
      });

      return success(insertedActionCommentaire);
    } catch (error) {
      if (
        isErrorWithCause(error) &&
        error.cause.code ===
          PgIntegrityConstraintViolation.ForeignKeyViolation &&
        error.cause.constraint === 'action_commentaire_action_id_fkey'
      ) {
        this.logger.warn(
          `L'action ${actionId} n'existe pas pour le référentiel ${referentielId}`
        );
        return failure(UpdateActionCommentaireErrorEnum.ACTION_NOT_FOUND);
      }

      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
}
