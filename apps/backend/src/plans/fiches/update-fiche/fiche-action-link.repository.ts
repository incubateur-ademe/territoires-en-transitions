import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { type ReferentielId } from '@tet/domain/referentiels';
import { and, asc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';

export type FicheActionLink = {
  ficheId: number;
  actionId: string;
};

@Injectable()
export class FicheActionLinkRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listLinksForCollectivite(
    collectiviteId: number,
    referentielIds: ReferentielId[]
  ): Promise<FicheActionLink[]> {
    if (referentielIds.length === 0) {
      return [];
    }

    const prefixConditions = referentielIds.map((referentielId) =>
      like(ficheActionActionTable.actionId, `${referentielId}_%`)
    );

    const rows = await this.databaseService.db
      .select({
        ficheId: ficheActionActionTable.ficheId,
        actionId: ficheActionActionTable.actionId,
      })
      .from(ficheActionActionTable)
      .innerJoin(
        ficheActionTable,
        eq(ficheActionActionTable.ficheId, ficheActionTable.id)
      )
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          or(...prefixConditions)
        )
      )
      .orderBy(
        asc(ficheActionActionTable.actionId),
        asc(ficheActionActionTable.ficheId)
      );

    return rows.filter(
      (row): row is FicheActionLink =>
        row.ficheId != null && row.actionId != null
    );
  }

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
