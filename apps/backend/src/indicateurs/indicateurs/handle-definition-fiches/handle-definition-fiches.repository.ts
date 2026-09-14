import { Injectable } from '@nestjs/common';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, inArray, or } from 'drizzle-orm';

type UpsertIndicateurFiches = Readonly<{
  indicateurId: number;
  collectiviteId: number;
  ficheIds: number[];
  ficheIdsToUnlink: number[];
}>;

@Injectable()
export class HandleDefinitionFichesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private getCollectiviteScope(collectiviteId: number, tx?: Transaction) {
    return or(
      eq(ficheActionTable.collectiviteId, collectiviteId),
      inArray(
        ficheActionTable.id,
        (tx ?? this.databaseService.db)
          .select({ ficheId: ficheActionSharingTable.ficheId })
          .from(ficheActionSharingTable)
          .where(eq(ficheActionSharingTable.collectiviteId, collectiviteId))
      )
    );
  }

  async areFichesInCollectiviteScope(
    ficheIds: number[],
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const uniqueFicheIds = [...new Set(ficheIds)];
    if (uniqueFicheIds.length === 0) {
      return true;
    }

    const fiches = await (tx ?? this.databaseService.db)
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(
        and(
          inArray(ficheActionTable.id, uniqueFicheIds),
          this.getCollectiviteScope(collectiviteId, tx)
        )
      );

    return fiches.length === uniqueFicheIds.length;
  }

  async listIndicateurFicheIds(
    {
      indicateurId,
      collectiviteId,
    }: {
      indicateurId: number;
      collectiviteId: number;
    },
    tx?: Transaction
  ): Promise<number[]> {
    const fiches = await (tx ?? this.databaseService.db)
      .select({ id: ficheActionTable.id })
      .from(ficheActionIndicateurTable)
      .innerJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionIndicateurTable.ficheId)
      )
      .where(
        and(
          eq(ficheActionIndicateurTable.indicateurId, indicateurId),
          this.getCollectiviteScope(collectiviteId, tx)
        )
      );

    return fiches.map(({ id }) => id);
  }

  async upsertIndicateurFiches(
    {
      indicateurId,
      collectiviteId,
      ficheIds,
      ficheIdsToUnlink,
    }: UpsertIndicateurFiches,
    tx?: Transaction
  ): Promise<void> {
    const writeDb = tx ?? this.databaseService.db;
    if (ficheIdsToUnlink.length > 0) {
      await writeDb
        .delete(ficheActionIndicateurTable)
        .where(
          and(
            eq(ficheActionIndicateurTable.indicateurId, indicateurId),
            inArray(ficheActionIndicateurTable.ficheId, ficheIdsToUnlink),
            inArray(
              ficheActionIndicateurTable.ficheId,
              writeDb
                .select({ id: ficheActionTable.id })
                .from(ficheActionTable)
                .where(this.getCollectiviteScope(collectiviteId, tx))
            )
          )
        );
    }

    if (ficheIds.length > 0) {
      await writeDb
        .insert(ficheActionIndicateurTable)
        .values(ficheIds.map((ficheId) => ({ ficheId, indicateurId })))
        .onConflictDoNothing();
    }
  }
}
