import { Injectable } from '@nestjs/common';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurSource,
  IndicateurValeurAvecMetadonnesDefinition,
} from '@tet/domain/indicateurs';
import {
  and,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNull,
  lte,
  or,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { omit } from 'es-toolkit';
import {
  indicateurDefinitionPeriodiciteSelection,
  indicateurEffectivePeriodicite,
  indicateurValeurPeriodiciteSelection,
} from '../definitions/indicateur-periodicite.sql';
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

@Injectable()
export class CrudValeursRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private getListConditions(
    options: ListIndicateurValeursQuery
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(
        indicateurValeurPeriodiciteSelection.periodicite,
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
          ...indicateurValeurPeriodiciteSelection,
          ...omit(getTableColumns(indicateurValeurTable), [
            'createdAt',
            'modifiedAt',
          ]),
          createdAt: sqlToDateTimeISO(indicateurValeurTable.createdAt),
          modifiedAt: sqlToDateTimeISO(indicateurValeurTable.modifiedAt),
        },
        indicateurDefinition: {
          ...indicateurDefinitionPeriodiciteSelection,
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
}
