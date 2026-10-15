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

  async listFicheIdsLinkedToAction(
    { actionId, collectiviteId }: { actionId: string; collectiviteId: number },
    tx?: Transaction
  ): Promise<number[]> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ ficheId: ficheActionActionTable.ficheId })
      .from(ficheActionActionTable)
      .innerJoin(
        ficheActionTable,
        eq(ficheActionActionTable.ficheId, ficheActionTable.id)
      )
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          eq(ficheActionActionTable.actionId, actionId)
        )
      );
    return rows.flatMap((row) => (row.ficheId != null ? [row.ficheId] : []));
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

  /** Sérialise les mises à jour des liens d'une même action. */
  async lockActionLinks(actionId: string, tx: Transaction): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${actionId}))`);
  }

  async updateLinksForAction(
    {
      actionId,
      addedFicheIds,
      removedFicheIds,
    }: {
      actionId: string;
      addedFicheIds: number[];
      removedFicheIds: number[];
    },
    tx: Transaction
  ): Promise<void> {
    if (removedFicheIds.length > 0) {
      await tx
        .delete(ficheActionActionTable)
        .where(
          and(
            eq(ficheActionActionTable.actionId, actionId),
            inArray(ficheActionActionTable.ficheId, removedFicheIds)
          )
        );
    }

    if (addedFicheIds.length > 0) {
      await tx
        .insert(ficheActionActionTable)
        .values(addedFicheIds.map((ficheId) => ({ ficheId, actionId })))
        .onConflictDoNothing();
    }
  }
}
