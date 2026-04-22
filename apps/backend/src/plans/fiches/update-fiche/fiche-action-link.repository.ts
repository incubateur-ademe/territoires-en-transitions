import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';

@Injectable()
export class FicheActionLinkRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findFichesByIds(
    ficheIds: number[],
    tx?: Transaction
  ): Promise<Array<{ id: number; collectiviteId: number }>> {
    if (ficheIds.length === 0) {
      return [];
    }
    return (tx ?? this.databaseService.db)
      .select({
        id: ficheActionTable.id,
        collectiviteId: ficheActionTable.collectiviteId,
      })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, ficheIds));
  }

  async replaceLinksForActionInCollectivite(
    {
      actionId,
      collectiviteId,
      ficheIds,
    }: {
      actionId: string;
      collectiviteId: number;
      ficheIds: number[];
    },
    tx: Transaction
  ): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${actionId}))`);

    const fichesInCollectivite = tx
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, collectiviteId));

    await tx
      .delete(ficheActionActionTable)
      .where(
        and(
          inArray(ficheActionActionTable.ficheId, fichesInCollectivite),
          eq(ficheActionActionTable.actionId, actionId)
        )
      );

    if (ficheIds.length > 0) {
      await tx
        .insert(ficheActionActionTable)
        .values(ficheIds.map((ficheId) => ({ ficheId, actionId })))
        .onConflictDoNothing();
    }
  }
}
