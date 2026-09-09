import { indicateurEffectivePeriodicite } from '../definitions/indicateur-periodicite.sql';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import { Injectable } from '@nestjs/common';
import {
  groupementCollectiviteTable,
  GroupementCollectiviteType,
} from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurSource,
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import {
  and,
  asc,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { omit } from 'es-toolkit';
import { indicateurValeurTable } from './indicateur-valeur.table';

type ListIndicateurValeursQuery = Readonly<{
  collectiviteId: number;
  indicateurIds?: number[];
  identifiantsReferentiel?: string[];
  sources?: string[];
  metadonneeId?: number;
  periodicite?: IndicateurPeriodicite;
  dateDebut?: string;
  dateFin?: string;
}>;

type DeleteIndicateurValeursScope = Readonly<{
  collectiviteId: number;
  indicateurId?: number;
  metadonneeId?: number;
}>;

type GroupementMembershipScope = Readonly<{
  groupementId: number;
  collectiviteId: number;
}>;

type UserValeurKey = {
  collectiviteId: number;
  indicateurId: number;
  id: number;
};

type UserValeurFields = Pick<
  IndicateurValeurCreate,
  | 'resultat'
  | 'resultatCommentaire'
  | 'objectif'
  | 'objectifCommentaire'
  | 'calculAuto'
  | 'calculAutoIdentifiantsManquants'
  | 'modifiedBy'
  | 'modifiedAt'
>;

@Injectable()
export class CrudValeursRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private getListConditions(
    options: ListIndicateurValeursQuery
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(
        indicateurValeurTable.periodicite,
        options.periodicite ?? indicateurEffectivePeriodicite
      ),
    ];
    if (options.collectiviteId) {
      conditions.push(
        eq(indicateurValeurTable.collectiviteId, options.collectiviteId)
      );
    }
    if (options.identifiantsReferentiel?.length) {
      conditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          options.identifiantsReferentiel
        )
      );
    }
    if (options.dateDebut) {
      conditions.push(gte(indicateurValeurTable.dateValeur, options.dateDebut));
    }
    if (options.dateFin) {
      conditions.push(lte(indicateurValeurTable.dateValeur, options.dateFin));
    }
    if (options.indicateurIds) {
      conditions.push(
        inArray(indicateurValeurTable.indicateurId, options.indicateurIds)
      );
    }
    if (options.sources?.length) {
      const includesCollectivite = options.sources.includes(
        COLLECTIVITE_SOURCE_ID
      );
      if (includesCollectivite) {
        const otherSourceIds = options.sources.filter(
          (sourceId) => sourceId !== COLLECTIVITE_SOURCE_ID
        );
        const sourceCondition = otherSourceIds.length
          ? or(
              isNull(indicateurSourceMetadonneeTable.sourceId),
              inArray(indicateurSourceMetadonneeTable.sourceId, otherSourceIds)
            )
          : isNull(indicateurSourceMetadonneeTable.sourceId);
        if (sourceCondition) conditions.push(sourceCondition);
      } else {
        conditions.push(
          inArray(indicateurSourceMetadonneeTable.sourceId, options.sources)
        );
      }
    }
    if (options.metadonneeId !== undefined) {
      conditions.push(
        eq(indicateurValeurTable.metadonneeId, options.metadonneeId)
      );
    }
    return conditions;
  }

  async listIndicateurValeurs(
    options: ListIndicateurValeursQuery,
    tx?: Transaction
  ): Promise<IndicateurValeurAvecMetadonnesDefinition[]> {
    return (tx ?? this.databaseService.db)
      .select({
        indicateurValeur: {
          ...omit(getTableColumns(indicateurValeurTable), [
            'createdAt',
            'modifiedAt',
          ]),
          createdAt: sqlToDateTimeISO(indicateurValeurTable.createdAt),
          modifiedAt: sqlToDateTimeISO(indicateurValeurTable.modifiedAt),
        },
        indicateurDefinition: {
          ...omit(getTableColumns(indicateurDefinitionTable), [
            'createdAt',
            'modifiedAt',
          ]),
          createdAt: sqlToDateTimeISO(indicateurDefinitionTable.createdAt),
          modifiedAt: sqlToDateTimeISO(indicateurDefinitionTable.modifiedAt),
        },
        indicateurSourceMetadonnee: getTableColumns(
          indicateurSourceMetadonneeTable
        ),
        confidentiel: indicateurCollectiviteTable.confidentiel,
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
      .leftJoin(
        indicateurCollectiviteTable,
        and(
          eq(
            indicateurCollectiviteTable.indicateurId,
            indicateurDefinitionTable.id
          ),
          eq(
            indicateurCollectiviteTable.collectiviteId,
            indicateurValeurTable.collectiviteId
          )
        )
      )
      .where(and(...this.getListConditions(options)));
  }

  async listSources(
    sourceIds: string[],
    tx?: Transaction
  ): Promise<IndicateurSource[]> {
    if (sourceIds.length === 0) return [];
    return (tx ?? this.databaseService.db)
      .select()
      .from(indicateurSourceTable)
      .where(inArray(indicateurSourceTable.id, sourceIds));
  }

  /**
   * Verrouille les appartenances utilisées pour autoriser le lot d'écriture.
   * Une suppression concurrente attend ainsi la fin de la transaction qui a
   * validé l'appartenance avant d'écrire les valeurs.
   */
  async lockGroupementMemberships(
    scopes: readonly GroupementMembershipScope[],
    tx: Transaction
  ): Promise<
    Pick<GroupementCollectiviteType, 'groupementId' | 'collectiviteId'>[]
  > {
    if (scopes.length === 0) return [];

    const collectiviteIdsByGroupementId = new Map<number, Set<number>>();
    for (const { groupementId, collectiviteId } of scopes) {
      const collectiviteIds =
        collectiviteIdsByGroupementId.get(groupementId) ?? new Set<number>();
      collectiviteIds.add(collectiviteId);
      collectiviteIdsByGroupementId.set(groupementId, collectiviteIds);
    }

    const membershipConditions = [...collectiviteIdsByGroupementId.entries()]
      .sort(
        ([leftGroupementId], [rightGroupementId]) =>
          leftGroupementId - rightGroupementId
      )
      .map(([groupementId, collectiviteIds]) =>
        and(
          eq(groupementCollectiviteTable.groupementId, groupementId),
          inArray(
            groupementCollectiviteTable.collectiviteId,
            [...collectiviteIds].sort((left, right) => left - right)
          )
        )
      );

    return tx
      .select({
        groupementId: groupementCollectiviteTable.groupementId,
        collectiviteId: groupementCollectiviteTable.collectiviteId,
      })
      .from(groupementCollectiviteTable)
      .where(or(...membershipConditions))
      .orderBy(
        asc(groupementCollectiviteTable.groupementId),
        asc(groupementCollectiviteTable.collectiviteId)
      )
      .for('share');
  }

  async listValeursToDelete(
    options: DeleteIndicateurValeursScope,
    tx: Transaction
  ): Promise<IndicateurValeur[]> {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(indicateurValeurTable.collectiviteId, options.collectiviteId),
    ];
    if (options.indicateurId) {
      conditions.push(
        eq(indicateurValeurTable.indicateurId, options.indicateurId)
      );
    }
    if (options.metadonneeId) {
      conditions.push(
        eq(indicateurValeurTable.metadonneeId, options.metadonneeId)
      );
    }
    return tx
      .select()
      .from(indicateurValeurTable)
      .where(and(...conditions));
  }

  async deleteByIds(
    ids: number[],
    tx?: Transaction
  ): Promise<IndicateurValeur[]> {
    if (ids.length === 0) return [];
    return (tx ?? this.databaseService.db)
      .delete(indicateurValeurTable)
      .where(inArray(indicateurValeurTable.id, ids))
      .returning();
  }

  async findUserValeur(
    key: UserValeurKey,
    tx: Transaction
  ): Promise<IndicateurValeur | undefined> {
    const rows = await tx
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, key.collectiviteId),
          eq(indicateurValeurTable.indicateurId, key.indicateurId),
          eq(indicateurValeurTable.id, key.id),
          isNull(indicateurValeurTable.metadonneeId)
        )
      )
      .limit(1);
    return rows[0];
  }

  async updateUserValeur(
    key: UserValeurKey,
    fields: UserValeurFields,
    tx?: Transaction
  ): Promise<IndicateurValeur | undefined> {
    const rows = await (tx ?? this.databaseService.db)
      .update(indicateurValeurTable)
      .set(fields)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, key.collectiviteId),
          eq(indicateurValeurTable.indicateurId, key.indicateurId),
          eq(indicateurValeurTable.id, key.id),
          isNull(indicateurValeurTable.metadonneeId)
        )
      )
      .returning();
    return rows[0];
  }

  async upsertUserValeur(
    valeur: IndicateurValeurCreate,
    tx?: Transaction
  ): Promise<IndicateurValeur | undefined> {
    const rows = await (tx ?? this.databaseService.db)
      .insert(indicateurValeurTable)
      .values(valeur)
      .onConflictDoUpdate({
        target: [
          indicateurValeurTable.indicateurId,
          indicateurValeurTable.collectiviteId,
          indicateurValeurTable.dateValeur,
          indicateurValeurTable.periodicite,
        ],
        targetWhere: isNull(indicateurValeurTable.metadonneeId),
        set: {
          ...(valeur.resultat !== undefined && { resultat: valeur.resultat }),
          ...(valeur.resultatCommentaire !== undefined && {
            resultatCommentaire: valeur.resultatCommentaire,
          }),
          ...(valeur.objectif !== undefined && { objectif: valeur.objectif }),
          ...(valeur.objectifCommentaire !== undefined && {
            objectifCommentaire: valeur.objectifCommentaire,
          }),
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
          modifiedBy: valeur.modifiedBy,
          modifiedAt: valeur.modifiedAt,
        },
      })
      .returning();
    return rows[0];
  }

  async deleteUserValeur(
    key: UserValeurKey,
    tx?: Transaction
  ): Promise<IndicateurValeur | undefined> {
    const rows = await (tx ?? this.databaseService.db)
      .delete(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, key.collectiviteId),
          eq(indicateurValeurTable.indicateurId, key.indicateurId),
          eq(indicateurValeurTable.id, key.id),
          isNull(indicateurValeurTable.metadonneeId)
        )
      )
      .returning();
    return rows[0];
  }

  async upsertValeursWithoutMetadata(
    valeurs: IndicateurValeurCreate[],
    tx?: Transaction
  ): Promise<IndicateurValeur[]> {
    if (valeurs.length === 0) return [];
    return (tx ?? this.databaseService.db)
      .insert(indicateurValeurTable)
      .values(valeurs)
      .onConflictDoUpdate({
        target: [
          indicateurValeurTable.indicateurId,
          indicateurValeurTable.collectiviteId,
          indicateurValeurTable.dateValeur,
          indicateurValeurTable.periodicite,
        ],
        targetWhere: isNull(indicateurValeurTable.metadonneeId),
        set: {
          resultat: sql.raw(`excluded.${indicateurValeurTable.resultat.name}`),
          resultatCommentaire: sql.raw(
            `excluded.${indicateurValeurTable.resultatCommentaire.name}`
          ),
          objectif: sql.raw(`excluded.${indicateurValeurTable.objectif.name}`),
          objectifCommentaire: sql.raw(
            `excluded.${indicateurValeurTable.objectifCommentaire.name}`
          ),
          calculAuto: sql.raw(
            `excluded.${indicateurValeurTable.calculAuto.name}`
          ),
          calculAutoIdentifiantsManquants: sql.raw(
            `excluded.${indicateurValeurTable.calculAutoIdentifiantsManquants.name}`
          ),
          modifiedBy: sql.raw(
            `excluded.${indicateurValeurTable.modifiedBy.name}`
          ),
        },
        setWhere: sql`
          excluded.calcul_auto IS NOT TRUE
          OR ${indicateurValeurTable.calculAuto} IS TRUE
        `,
      })
      .returning();
  }

  async upsertValeursWithMetadata(
    valeurs: IndicateurValeurCreate[],
    tx?: Transaction
  ): Promise<IndicateurValeur[]> {
    if (valeurs.length === 0) return [];
    return (tx ?? this.databaseService.db)
      .insert(indicateurValeurTable)
      .values(valeurs)
      .onConflictDoUpdate({
        target: [
          indicateurValeurTable.indicateurId,
          indicateurValeurTable.collectiviteId,
          indicateurValeurTable.dateValeur,
          indicateurValeurTable.periodicite,
          indicateurValeurTable.metadonneeId,
        ],
        targetWhere: isNotNull(indicateurValeurTable.metadonneeId),
        set: {
          resultat: sql.raw(`excluded.${indicateurValeurTable.resultat.name}`),
          resultatCommentaire: sql.raw(
            `excluded.${indicateurValeurTable.resultatCommentaire.name}`
          ),
          objectif: sql.raw(`excluded.${indicateurValeurTable.objectif.name}`),
          objectifCommentaire: sql.raw(
            `excluded.${indicateurValeurTable.objectifCommentaire.name}`
          ),
          calculAuto: sql.raw(
            `excluded.${indicateurValeurTable.calculAuto.name}`
          ),
          calculAutoIdentifiantsManquants: sql.raw(
            `excluded.${indicateurValeurTable.calculAutoIdentifiantsManquants.name}`
          ),
          modifiedBy: sql.raw(
            `excluded.${indicateurValeurTable.modifiedBy.name}`
          ),
        },
      })
      .returning();
  }

  async deleteAutomaticValeurs(
    ids: number[],
    { collectiviteId }: { collectiviteId?: number },
    tx?: Transaction
  ): Promise<IndicateurValeur[]> {
    if (ids.length === 0) return [];
    const conditions: SQLWrapper[] = [
      eq(indicateurValeurTable.calculAuto, true),
      inArray(indicateurValeurTable.id, ids),
    ];
    if (collectiviteId !== undefined) {
      conditions.push(eq(indicateurValeurTable.collectiviteId, collectiviteId));
    }
    return (tx ?? this.databaseService.db)
      .delete(indicateurValeurTable)
      .where(and(...conditions))
      .returning();
  }

  async listRecomputeCandidateCollectiviteIds({
    sourceIdentifiants,
    computedIndicateurIds,
  }: {
    sourceIdentifiants: string[];
    computedIndicateurIds: number[];
  }): Promise<number[]> {
    const conditions: SQLWrapper[] = [];
    if (sourceIdentifiants.length > 0) {
      conditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          sourceIdentifiants
        )
      );
    }
    if (computedIndicateurIds.length > 0) {
      const automaticComputedValues = and(
        inArray(indicateurValeurTable.indicateurId, computedIndicateurIds),
        eq(indicateurValeurTable.calculAuto, true)
      );
      if (automaticComputedValues) conditions.push(automaticComputedValues);
    }
    if (conditions.length === 0) return [];

    const rows = await this.databaseService.db
      .selectDistinct({ id: indicateurValeurTable.collectiviteId })
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
      )
      .where(or(...conditions));
    return rows.map(({ id }) => id);
  }
}
