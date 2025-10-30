import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
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
    force,
    user,
  }: {
    ficheId: number;
    user: AuthenticatedUser;
    force?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    await this.fichePermissionService.canDeleteFiche(ficheId, user);

    const ficheIdCondition = or(
      eq(ficheActionTable.id, ficheId),
      eq(ficheActionTable.parentId, ficheId)
    );

    try {
      if (force) {
        this.logger.log(`Deleting fiche action with id ${ficheId}`);
        await this.databaseService.db
          .delete(ficheActionTable)
          .where(ficheIdCondition);
      } else {
        this.logger.log(`Soft deleting fiche action with id ${ficheId}`);
        await this.databaseService.db
          .update(ficheActionTable)
          .set({
            deleted: true,
            modifiedBy: user.id,
            modifiedAt: new Date().toISOString(),
          })
          .where(ficheIdCondition);

        this.logger.log(
          `Successfully soft deleted fiche action with id ${ficheId}`
        );
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
