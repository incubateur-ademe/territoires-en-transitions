import {
  axeTable,
  FicheWithRelations,
} from '@/backend/plans/fiches/index-domain';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { DatabaseService } from '@/backend/utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  getTableColumns,
  getTableName,
  inArray,
  sql,
} from 'drizzle-orm';
import {
  FicheActionSharing,
  FicheActionSharingInsert,
  ficheActionSharingTable,
} from './fiche-action-sharing.table';

@Injectable()
export class ShareFicheActionService {
  private readonly logger = new Logger(ShareFicheActionService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getFicheActionSharing(ficheId: number): Promise<FicheActionSharing[]> {
    return this.databaseService.db
      .select()
      .from(ficheActionSharingTable)
      .where(eq(ficheActionSharingTable.ficheId, ficheId));
  }

  async shareFicheAction(
    fiche: FicheWithRelations,
    updatedWithCollectiviteIds: number[],
    tx?: Transaction
  ): Promise<{
    addedCollectiviteIds: number[];
    removedCollectiviteIds: number[];
  }> {
    const collectiviteIdToRemove: number[] =
      fiche.sharedWithCollectivites
        ?.filter((sharing) => !updatedWithCollectiviteIds.includes(sharing.id))
        .map((sharing) => sharing.id) || [];

    const collectiviteIdToAdd: number[] = updatedWithCollectiviteIds.filter(
      (id) =>
        !fiche.sharedWithCollectivites?.some((sharing) => sharing.id === id)
    );

    if (collectiviteIdToRemove.length > 0) {
      this.logger.log(
        `Deleting ${collectiviteIdToRemove.length} existing sharing for fiche ${
          fiche.id
        } for collectivite ids ${collectiviteIdToRemove.join(', ')}`
      );

      await (tx ?? this.databaseService.db)
        .delete(ficheActionSharingTable)
        .where(
          and(
            eq(ficheActionSharingTable.ficheId, fiche.id),
            inArray(
              ficheActionSharingTable.collectiviteId,
              collectiviteIdToRemove
            )
          )
        );

      // Remove also if have been placed in some axes
      // Delete join not available https://github.com/drizzle-team/drizzle-orm/issues/3100
      const collectiviteIdToRemoveString = collectiviteIdToRemove.join(',');
      const deleteQuery = sql`
      DELETE FROM ${sql.identifier(getTableName(ficheActionAxeTable))} l
      USING ${sql.identifier(getTableName(axeTable))} d
      WHERE d.${sql.identifier(
        getTableColumns(axeTable).id.name
      )} = l.${sql.identifier(getTableColumns(ficheActionAxeTable).axeId.name)}
      AND d.${sql.identifier(
        getTableColumns(axeTable).collectiviteId.name
      )} IN (${sql.raw(collectiviteIdToRemoveString)})`;

      await (tx ?? this.databaseService.db).execute(deleteQuery);
    } else {
      this.logger.log(`No sharing to be deleted for fiche ${fiche.id}`);
    }

    if (collectiviteIdToAdd.length > 0) {
      this.logger.log(
        `Sharing fiche ${fiche.id} with ${
          collectiviteIdToAdd.length
        } new collectivite with ids ${collectiviteIdToAdd.join(', ')}`
      );

      const newSharings: FicheActionSharingInsert[] = collectiviteIdToAdd.map(
        (collectiviteId) => ({
          ficheId: fiche.id,
          collectiviteId,
        })
      );

      await (tx ?? this.databaseService.db)
        .insert(ficheActionSharingTable)
        .values(newSharings);
    }

    return {
      addedCollectiviteIds: collectiviteIdToAdd,
      removedCollectiviteIds: collectiviteIdToRemove,
    };
  }
}
