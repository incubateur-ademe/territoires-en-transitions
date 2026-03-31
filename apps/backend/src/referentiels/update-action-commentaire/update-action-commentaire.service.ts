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
import { and, eq, sql } from 'drizzle-orm';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { actionCommentaireTable } from '../models/action-commentaire.table';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { UpdateActionCommentaireHistoriqueRepository } from './update-action-commentaire-historique.repository';
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
    private readonly snapshotsService: SnapshotsService,
    private readonly updateActionCommentaireHistoriqueRepository: UpdateActionCommentaireHistoriqueRepository
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
      const insertedActionCommentaire =
        await this.databaseService.db.transaction(async (tx) => {
          // Fetch old value before upsert
          const oldRow = await tx
            .select()
            .from(actionCommentaireTable)
            .where(
              and(
                eq(actionCommentaireTable.collectiviteId, collectiviteId),
                eq(actionCommentaireTable.actionId, actionId)
              )
            )
            .for('update')
            .then((rows) => rows[0] ?? null);

          // Upsert
          const result = await tx
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
            .then((r) => r[0]);

          // Write history
          await this.updateActionCommentaireHistoriqueRepository.save(
            tx,
            result,
            oldRow,
            user.id
          );

          return result;
        });

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
