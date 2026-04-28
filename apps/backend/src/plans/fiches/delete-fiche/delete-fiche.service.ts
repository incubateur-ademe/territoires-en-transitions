import { Injectable, Logger } from '@nestjs/common';
import { FicheIndexerService } from '@tet/backend/plans/fiches/fiche-indexer/fiche-indexer.service';
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
    private readonly fichePermissionService: FicheActionPermissionsService,
    private readonly ficheIndexerService: FicheIndexerService
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

    // Récupère la liste des fiches impactées (parent + enfants directs) AVANT
    // la suppression : une fois la cascade exécutée (hard ou soft), les ids
    // des enfants ne sont plus accessibles via `parent_id` (hard-delete les
    // a retirés ; soft-delete les a juste marqués mais on ne veut pas
    // dépendre de l'état post-mutation pour décider quoi désindexer).
    // L'enqueue se fait après l'opération, sur cette liste figée.
    const impactedFiches = await db
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(ficheIdCondition);
    const impactedIds = impactedFiches.map((row) => row.id);

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

      // Indexation Meilisearch : suppression du document pour le parent et
      // chaque enfant. Le mode `'soft'` retire AUSSI le document (au lieu
      // d'un upsert avec `deleted = true`), pour ne pas avoir à filtrer sur
      // `deleted` côté lecture. Try/catch + warn : une panne BullMQ ne
      // doit pas remonter une erreur métier ; le backfill admin (U8) corrige
      // la dérive éventuelle.
      try {
        await Promise.all(
          impactedIds.map((id) => this.ficheIndexerService.enqueueDelete(id))
        );
      } catch (indexerError) {
        this.logger.warn(
          `Échec de l'enqueue de suppression d'index pour la fiche ${ficheId} (et enfants ${impactedIds.join(
            ', '
          )}) : ${
            indexerError instanceof Error
              ? indexerError.message
              : String(indexerError)
          }`
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
