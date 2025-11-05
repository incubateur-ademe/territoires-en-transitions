import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import {
  FicheSharing,
  FicheSharingCreate,
  FicheWithRelations,
} from '@/domain/plans';
import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  getTableColumns,
  getTableName,
  inArray,
  sql,
} from 'drizzle-orm';
import { ficheActionSharingTable } from './fiche-action-sharing.table';

@Injectable()
export class ShareFicheService {
  private readonly logger = new Logger(ShareFicheService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listFicheSharings(ficheId: number): Promise<FicheSharing[]> {
    return this.databaseService.db
      .select()
      .from(ficheActionSharingTable)
      .where(eq(ficheActionSharingTable.ficheId, ficheId));
  }

  private async removeFichesSharings(
    ficheIds: number[],
    collectiviteIdsToRemove: number[],
    tx?: Transaction
  ): Promise<void> {
    if (collectiviteIdsToRemove.length > 0) {
      this.logger.log(
        `Deleting ${
          collectiviteIdsToRemove.length
        } existing sharing for fiches ${ficheIds.join(
          ', '
        )} for collectivite ids ${collectiviteIdsToRemove.join(', ')}`
      );

      await (tx ?? this.databaseService.db)
        .delete(ficheActionSharingTable)
        .where(
          and(
            inArray(ficheActionSharingTable.ficheId, ficheIds),
            inArray(
              ficheActionSharingTable.collectiviteId,
              collectiviteIdsToRemove
            )
          )
        );

      // Remove also if have been placed in some axes
      // Delete join not available https://github.com/drizzle-team/drizzle-orm/issues/3100
      const deleteQuery = sql`
      DELETE FROM ${sql.identifier(getTableName(ficheActionAxeTable))} l
      USING ${sql.identifier(getTableName(axeTable))} d
      WHERE d.${sql.identifier(
        getTableColumns(axeTable).id.name
      )} = l.${sql.identifier(getTableColumns(ficheActionAxeTable).axeId.name)}
      AND d.${sql.identifier(
        getTableColumns(axeTable).collectiviteId.name
      )} IN (${sql.raw(collectiviteIdsToRemove.join(','))})
      AND l.${sql.identifier(
        getTableColumns(ficheActionAxeTable).ficheId.name
      )} IN (${sql.raw(ficheIds.join(','))})`;

      await (tx ?? this.databaseService.db).execute(deleteQuery);

      // We don't want to remove tags & pilotes associated to these collectivites. At least for now.
    } else {
      this.logger.log(
        `No sharing to be deleted for fiches ${ficheIds.join(', ')}`
      );
    }
  }

  private async addFichesSharings(
    ficheIds: number[],
    collectiviteIdsToAdd: number[],
    userId?: string | null,
    tx?: Transaction
  ): Promise<void> {
    if (collectiviteIdsToAdd.length > 0) {
      this.logger.log(
        `Sharing fiches ${ficheIds.join(', ')} with ${
          collectiviteIdsToAdd.length
        } new collectivite with ids ${collectiviteIdsToAdd.join(', ')}`
      );

      const allNewSharings = ficheIds
        .map((ficheId) => {
          const newSharings: FicheSharingCreate[] = collectiviteIdsToAdd.map(
            (collectiviteId) => ({
              ficheId: ficheId,
              collectiviteId,
              createdBy: userId,
            })
          );
          return newSharings;
        })
        .flat();

      await (tx ?? this.databaseService.db)
        .insert(ficheActionSharingTable)
        .values(allNewSharings)
        .onConflictDoNothing();
    } else {
      this.logger.log(
        `No sharing to be added for fiches ${ficheIds.join(', ')}`
      );
    }
  }

  async shareFiche(
    fiche: FicheWithRelations,
    updatedWithCollectiviteIds: number[],
    userId?: string,
    tx?: Transaction
  ): Promise<{
    addedCollectiviteIds: number[];
    removedCollectiviteIds: number[];
  }> {
    const collectiviteIdToRemove: number[] =
      fiche.sharedWithCollectivites
        ?.filter((sharing) => !updatedWithCollectiviteIds.includes(sharing.id))
        .map((sharing) => sharing.id) || [];

    await this.removeFichesSharings([fiche.id], collectiviteIdToRemove, tx);

    const collectiviteIdToAdd: number[] = updatedWithCollectiviteIds.filter(
      (id) =>
        !fiche.sharedWithCollectivites?.some((sharing) => sharing.id === id)
    );

    await this.addFichesSharings([fiche.id], collectiviteIdToAdd, userId, tx);

    return {
      addedCollectiviteIds: collectiviteIdToAdd,
      removedCollectiviteIds: collectiviteIdToRemove,
    };
  }

  async bulkShareFiches(
    ficheIds: number[],
    collectiviteIdsToAdd: number[],
    collectiviteIdsToRemove: number[],
    userId?: string | null,
    tx?: Transaction
  ): Promise<void> {
    await this.removeFichesSharings(ficheIds, collectiviteIdsToRemove, tx);
    await this.addFichesSharings(ficheIds, collectiviteIdsToAdd, userId, tx);
  }
}
