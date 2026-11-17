import { Injectable } from '@nestjs/common';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurGroupeTable } from '@tet/backend/indicateurs/shared/models/indicateur-groupe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, sql } from 'drizzle-orm';

type ParentKey = Readonly<{ parentId: number; collectiviteId: number }>;

export type ParentForTotals = Readonly<{
  precision: number;
  confidentiel: boolean;
}>;

export type SousIndicateurConfidentialite = Readonly<{
  id: number;
  confidentiel: boolean;
}>;

@Injectable()
export class GetIndicateurTotalsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getParentForTotals(
    { parentId, collectiviteId }: ParentKey,
    tx?: Transaction
  ): Promise<ParentForTotals | null> {
    const [parent] = await (tx ?? this.databaseService.db)
      .select({
        precision: indicateurDefinitionTable.precision,
        confidentiel: sql<boolean>`coalesce(${indicateurCollectiviteTable.confidentiel}, false)`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurCollectiviteTable,
        and(
          eq(indicateurCollectiviteTable.indicateurId, parentId),
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId)
        )
      )
      .where(
        and(
          eq(indicateurDefinitionTable.id, parentId),
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    return parent ?? null;
  }

  async listSousIndicateurs(
    { parentId, collectiviteId }: ParentKey,
    tx?: Transaction
  ): Promise<SousIndicateurConfidentialite[]> {
    return (tx ?? this.databaseService.db)
      .select({
        id: indicateurDefinitionTable.id,
        confidentiel: sql<boolean>`coalesce(${indicateurCollectiviteTable.confidentiel}, false)`,
      })
      .from(indicateurGroupeTable)
      .innerJoin(
        indicateurDefinitionTable,
        eq(indicateurDefinitionTable.id, indicateurGroupeTable.enfant)
      )
      .leftJoin(
        indicateurCollectiviteTable,
        and(
          eq(
            indicateurCollectiviteTable.indicateurId,
            indicateurGroupeTable.enfant
          ),
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId)
        )
      )
      .where(
        and(
          eq(indicateurGroupeTable.parent, parentId),
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId)
        )
      );
  }
}
