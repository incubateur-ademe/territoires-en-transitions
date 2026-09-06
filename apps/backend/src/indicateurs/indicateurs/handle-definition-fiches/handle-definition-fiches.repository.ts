import { Injectable } from '@nestjs/common';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

type UpsertIndicateurFiches = Readonly<{
  indicateurId: number;
  collectiviteId: number;
  ficheIds: number[];
}>;

@Injectable()
export class HandleDefinitionFichesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async areFichesOwnedByCollectivite(
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
          eq(ficheActionTable.collectiviteId, collectiviteId)
        )
      );

    return fiches.length === uniqueFicheIds.length;
  }

  async upsertIndicateurFiches(
    { indicateurId, collectiviteId, ficheIds }: UpsertIndicateurFiches,
    tx?: Transaction
  ): Promise<void> {
    const writeDb = tx ?? this.databaseService.db;
    const deleteConditions = [
      eq(ficheActionIndicateurTable.indicateurId, indicateurId),
      inArray(
        ficheActionIndicateurTable.ficheId,
        writeDb
          .select({ id: ficheActionTable.id })
          .from(ficheActionTable)
          .where(eq(ficheActionTable.collectiviteId, collectiviteId))
      ),
    ];

    if (ficheIds.length > 0) {
      deleteConditions.push(
        notInArray(ficheActionIndicateurTable.ficheId, ficheIds)
      );
    }

    await writeDb
      .delete(ficheActionIndicateurTable)
      .where(and(...deleteConditions));

    if (ficheIds.length > 0) {
      await writeDb
        .insert(ficheActionIndicateurTable)
        .values(ficheIds.map((ficheId) => ({ ficheId, indicateurId })))
        .onConflictDoNothing();
    }
  }
}
