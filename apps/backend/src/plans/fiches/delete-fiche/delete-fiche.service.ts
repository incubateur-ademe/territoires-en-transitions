import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq, or } from 'drizzle-orm';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { ficheActionTable } from '../shared/models/fiche-action.table';

@Injectable()
export class DeleteFicheService {
  private readonly logger = new Logger(DeleteFicheService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fichePermissionService: FicheActionPermissionsService
  ) {}

  async deleteFiche({
    ficheId,
    deleteMode,
    user,
    transaction,
  }: {
    ficheId: number;
    user: AuthenticatedUser;
    deleteMode?: 'soft' | 'hard';
    transaction?: Transaction;
  }): Promise<{ success: boolean; error?: string }> {
    const db = transaction || this.databaseService.db;
    await this.fichePermissionService.canDeleteFiche(ficheId, user);

    const ficheIdCondition = or(
      eq(ficheActionTable.id, ficheId),
      eq(ficheActionTable.parentId, ficheId)
    );

    try {
      if (deleteMode === 'hard') {
        await db.delete(ficheActionTable).where(ficheIdCondition);
      } else {
        await db
          .update(ficheActionTable)
          .set({
            deleted: true,
            modifiedBy: user.id,
            modifiedAt: new Date().toISOString(),
          })
          .where(ficheIdCondition);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete fiche action with id ${ficheId}: ${error}`
      );
      return { success: false, error: 'DATABASE_ERROR' };
    }
  }
}
