import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { ficheActionTable } from '../shared/models/fiche-action.table';

@Injectable()
export class DeleteFicheService {
  private readonly logger = new Logger(DeleteFicheService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fichePermissionService: FicheActionPermissionsService
  ) {}

  async deleteFiche(
    ficheId: number,
    { user }: { user: AuthenticatedUser }
  ): Promise<{ success: boolean; error?: string }> {
    await this.fichePermissionService.canWriteFiche(ficheId, user);

    this.logger.log(`Soft deleting fiche action with id ${ficheId}`);

    try {
      await this.databaseService.db
        .update(ficheActionTable)
        .set({ deleted: true, modifiedBy: user.id, modifiedAt: new Date().toISOString() })
        .where(eq(ficheActionTable.id, ficheId));

      this.logger.log(`Successfully soft deleted fiche action with id ${ficheId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete fiche action with id ${ficheId}: ${error}`
      );
      return { success: false, error: 'DATABASE_ERROR' };
    }
  }
}
