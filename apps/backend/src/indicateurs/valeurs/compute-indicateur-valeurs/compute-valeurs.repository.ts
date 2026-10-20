import { Injectable } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceSourceCalculTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-source-calcul.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  IndicateurPeriode,
  IndicateurPeriodicite,
  PCAET_COLLECTIVITE_SOURCE_ID,
  IndicateurValeur,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { indicateurValeurTable } from '../indicateur-valeur.table';

type IndicateurSourceCalcul = {
  sourceId: string;
  sourceCalculIds: string[] | null;
};

export type { CalculSourceValeur } from './calcul-indicateur.types';
import type { CalculSourceValeur } from './calcul-indicateur.types';

export type CalculSourceValeurQuery = {
  collectiviteId: number;
  identifiants: string[];
  sourceId?: string | null;
  metadonneeId?: number | null;
  extraSourceCalculIds: string[];
  periode: IndicateurPeriode;
};

type StoredCalculatedValeur = IndicateurValeur & {
  periodicite: IndicateurPeriodicite | null;
  sourceId: string | null;
};

type StoredRelevantValeur = StoredCalculatedValeur & {
  indicateurIdentifiant: string | null;
  metadonneeDateVersion: string | null;
};

type IndicateurValeurPeriodeKey = Pick<
  IndicateurValeur,
  'collectiviteId' | 'dateValeur'
>;

// Population updates fan out across formulas and sources. Bound each SQL
// expression before Drizzle serializes it, even for a small incoming value batch.
const SOURCE_QUERIES_BATCH_SIZE = 500;

@Injectable()
export class ComputeValeursRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listSourceCalculs(tx?: Transaction): Promise<IndicateurSourceCalcul[]> {
    return (tx ?? this.databaseService.db)
      .select({
        sourceId: indicateurSourceTable.id,
        sourceCalculIds: sql<
          string[]
        >`array_agg(${indicateurSourceSourceCalculTable.sourceCalculId})`.as(
          'source_calcul_ids'
        ),
      })
      .from(indicateurSourceTable)
      .leftJoin(
        indicateurSourceSourceCalculTable,
        eq(indicateurSourceTable.id, indicateurSourceSourceCalculTable.sourceId)
      )
      .groupBy(indicateurSourceTable.id);
  }

  async listSourceValeurs(
    queries: CalculSourceValeurQuery[],
    tx?: Transaction
  ): Promise<CalculSourceValeur[]> {
    const groupedQueries = this.groupSourceQueries(queries);
    const valeursById = new Map<number, CalculSourceValeur>();
    for (
      let offset = 0;
      offset < groupedQueries.length;
      offset += SOURCE_QUERIES_BATCH_SIZE
    ) {
      const valeurs = await this.listSourceValeursBatch(
        groupedQueries.slice(offset, offset + SOURCE_QUERIES_BATCH_SIZE),
        tx
      );
      // Several formulas and source policies can select the same observation.
      // Preserve the union semantics of a single SELECT with OR conditions.
      for (const valeur of valeurs) valeursById.set(valeur.id, valeur);
    }
    return [...valeursById.values()];
  }

  private groupSourceQueries(
    queries: CalculSourceValeurQuery[]
  ): CalculSourceValeurQuery[] {
    const groups = new Map<
      string,
      { query: CalculSourceValeurQuery; identifiants: Set<string> }
    >();
    for (const query of queries) {
      // Formulas sharing the same scope can load their identifiers together.
      // PCAET metadata scopes and fallback-source policies must stay distinct.
      const key = JSON.stringify([
        query.collectiviteId,
        IndicateurPeriodes.key(query.periode),
        query.sourceId ?? null,
        query.sourceId === PCAET_COLLECTIVITE_SOURCE_ID
          ? query.metadonneeId
          : null,
        [...new Set(query.extraSourceCalculIds)].sort(),
      ]);
      let group = groups.get(key);
      if (!group) {
        group = { query, identifiants: new Set() };
        groups.set(key, group);
      }
      for (const identifiant of query.identifiants) {
        group.identifiants.add(identifiant);
      }
    }
    return [...groups.values()].map(({ query, identifiants }) => ({
      ...query,
      identifiants: [...identifiants],
    }));
  }

  private async listSourceValeursBatch(
    queries: CalculSourceValeurQuery[],
    tx?: Transaction
  ): Promise<CalculSourceValeur[]> {
    const conditions = queries.map(
      ({
        collectiviteId,
        identifiants,
        sourceId,
        metadonneeId,
        extraSourceCalculIds,
        periode,
      }) => {
        const sourceCondition = sourceId
          ? or(
              and(
                eq(indicateurSourceMetadonneeTable.sourceId, sourceId),
                sourceId === PCAET_COLLECTIVITE_SOURCE_ID &&
                  metadonneeId !== undefined &&
                  metadonneeId !== null &&
                  metadonneeId >= 0
                  ? eq(indicateurValeurTable.metadonneeId, metadonneeId)
                  : undefined
              ),
              inArray(
                indicateurSourceMetadonneeTable.sourceId,
                extraSourceCalculIds
              )
            )
          : or(
              isNull(indicateurSourceMetadonneeTable.sourceId),
              inArray(
                indicateurSourceMetadonneeTable.sourceId,
                extraSourceCalculIds
              )
            );

        return and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(
            indicateurValeurTable.dateValeur,
            IndicateurPeriodes.toDateValeur(periode)
          ),
          eq(indicateurValeurTable.periodicite, periode.periodicite),
          inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiants
          ),
          sourceCondition
        );
      }
    );

    const rows = await (tx ?? this.databaseService.db)
      .select({
        ...getTableColumns(indicateurValeurTable),
        indicateurIdentifiant: indicateurDefinitionTable.identifiantReferentiel,
        periodicite: indicateurValeurTable.periodicite,
        sourceId: indicateurSourceMetadonneeTable.sourceId,
        metadonneeDateVersion: indicateurSourceMetadonneeTable.dateVersion,
      })
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurValeurTable.metadonneeId,
          indicateurSourceMetadonneeTable.id
        )
      )
      .where(or(...conditions));

    return rows.map((valeur) => {
      if (!valeur.indicateurIdentifiant || !valeur.periodicite) {
        throw new Error(
          `Impossible d'hydrater la période de la valeur d'indicateur ${valeur.indicateurId}`
        );
      }
      return {
        ...valeur,
        indicateurIdentifiant: valeur.indicateurIdentifiant,
        deleted: false,
        periode: IndicateurPeriodes.fromDateValeur(
          valeur.periodicite,
          valeur.dateValeur
        ),
      };
    });
  }

  async listStoredCalculatedValeurs(
    {
      indicateurIds,
      collectiviteIds,
      dateValeurs,
    }: {
      indicateurIds: number[];
      collectiviteIds: number[];
      dateValeurs: string[];
    },
    tx: Transaction
  ): Promise<StoredCalculatedValeur[]> {
    if (
      indicateurIds.length === 0 ||
      collectiviteIds.length === 0 ||
      dateValeurs.length === 0
    ) {
      return [];
    }

    return tx
      .select({
        ...getTableColumns(indicateurValeurTable),
        periodicite: indicateurValeurTable.periodicite,
        sourceId: indicateurSourceMetadonneeTable.sourceId,
      })
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurValeurTable.metadonneeId,
          indicateurSourceMetadonneeTable.id
        )
      )
      .where(
        and(
          eq(indicateurValeurTable.calculAuto, true),
          inArray(indicateurValeurTable.indicateurId, indicateurIds),
          inArray(indicateurValeurTable.collectiviteId, collectiviteIds),
          inArray(indicateurValeurTable.dateValeur, dateValeurs)
        )
      );
  }

  async listPeriodeKeys(
    {
      collectiviteId,
      indicateurIds,
    }: { collectiviteId: number; indicateurIds: number[] },
    tx: Transaction
  ): Promise<IndicateurValeurPeriodeKey[]> {
    if (indicateurIds.length === 0) return [];
    return tx
      .select({
        collectiviteId: indicateurValeurTable.collectiviteId,
        dateValeur: indicateurValeurTable.dateValeur,
      })
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, indicateurIds)
        )
      );
  }

  async listRelevantValeurs(
    {
      collectiviteId,
      indicateurIds,
      dateValeurs,
    }: {
      collectiviteId: number;
      indicateurIds: number[];
      dateValeurs: string[];
    },
    tx: Transaction
  ): Promise<StoredRelevantValeur[]> {
    if (indicateurIds.length === 0 || dateValeurs.length === 0) return [];
    return tx
      .select({
        ...getTableColumns(indicateurValeurTable),
        indicateurIdentifiant: indicateurDefinitionTable.identifiantReferentiel,
        periodicite: indicateurValeurTable.periodicite,
        sourceId: indicateurSourceMetadonneeTable.sourceId,
        metadonneeDateVersion: indicateurSourceMetadonneeTable.dateVersion,
      })
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurValeurTable.metadonneeId,
          indicateurSourceMetadonneeTable.id
        )
      )
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, indicateurIds),
          inArray(indicateurValeurTable.dateValeur, dateValeurs)
        )
      );
  }
}
