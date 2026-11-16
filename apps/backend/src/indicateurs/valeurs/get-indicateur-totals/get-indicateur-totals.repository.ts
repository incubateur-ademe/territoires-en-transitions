import { Injectable } from '@nestjs/common';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurGroupeTable } from '@tet/backend/indicateurs/shared/models/indicateur-groupe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { SousIndicateurRattache } from '@tet/domain/indicateurs';
import { and, eq, sql } from 'drizzle-orm';

type ParentKey = Readonly<{ parentId: number; collectiviteId: number }>;

export type ParentForTotals = Readonly<{
  totalEstCumulDesSousIndicateurs: boolean;
  precision: number;
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
        totalEstCumulDesSousIndicateurs:
          indicateurDefinitionTable.totalEstCumulDesSousIndicateurs,
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

  async listSousIndicateursRattaches(
    { parentId, collectiviteId }: ParentKey,
    tx?: Transaction
  ): Promise<SousIndicateurRattache[]> {
    const queryResult = await (tx ?? this.databaseService.db).execute<{
      id: number;
      parent_id: number;
      confidentiel: boolean;
    }>(sql`
      WITH RECURSIVE descendants AS (
        SELECT ${indicateurGroupeTable.enfant} AS id,
               ${indicateurGroupeTable.parent} AS parent_id
        FROM ${indicateurGroupeTable}
        INNER JOIN ${indicateurDefinitionTable}
          ON ${indicateurDefinitionTable.id} = ${indicateurGroupeTable.enfant}
          AND ${indicateurDefinitionTable.collectiviteId} = ${collectiviteId}
        WHERE ${indicateurGroupeTable.parent} = ${parentId}
        UNION
        SELECT ${indicateurGroupeTable.enfant},
               ${indicateurGroupeTable.parent}
        FROM ${indicateurGroupeTable}
        INNER JOIN descendants ON ${indicateurGroupeTable.parent} = descendants.id
        INNER JOIN ${indicateurDefinitionTable}
          ON ${indicateurDefinitionTable.id} = ${indicateurGroupeTable.enfant}
          AND ${indicateurDefinitionTable.collectiviteId} = ${collectiviteId}
      )
      SELECT descendants.id,
             descendants.parent_id,
             coalesce(${indicateurCollectiviteTable.confidentiel}, false) AS confidentiel
      FROM descendants
      LEFT JOIN ${indicateurCollectiviteTable}
        ON ${indicateurCollectiviteTable.indicateurId} = descendants.id
        AND ${indicateurCollectiviteTable.collectiviteId} = ${collectiviteId}
      ORDER BY descendants.id
    `);

    return queryResult.rows.map(({ id, parent_id, confidentiel }) => ({
      id,
      parentId: parent_id,
      confidentiel,
    }));
  }
}
