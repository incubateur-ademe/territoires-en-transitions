import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { and, eq, gte, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import { StatsPeriodicity } from './get-stats.input';
import { PeriodCount } from './get-stats.rules';

@Injectable()
export class GetStatsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Fiches action créées, regroupées par période (début de période en UTC).
   *
   * Même périmètre que le calcul North Star « création de fiches » : hors
   * sous-actions et hors fiches supprimées. On exclut en plus les
   * collectivités de test, la route étant publique.
   */
  async countFichesCreeesParPeriode({
    periodicity,
    from,
  }: {
    periodicity: StatsPeriodicity;
    from: Date | null;
  }): Promise<PeriodCount[]> {
    // `periodicity` est validé par le schéma d'entrée et passé en paramètre.
    // Le regroupement se fait par position (`group by 1`) : répéter
    // l'expression créerait un second paramètre que Postgres ne saurait pas
    // rapprocher du premier.
    const periode = sql<string>`to_char(date_trunc(${periodicity}, ${ficheActionTable.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;

    return this.databaseService.db
      .select({
        periode,
        count: sql<number>`count(*)::int`,
      })
      .from(ficheActionTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, ficheActionTable.collectiviteId)
      )
      .where(
        and(
          isNotNull(ficheActionTable.createdAt),
          isNull(ficheActionTable.parentId),
          sql`${ficheActionTable.deleted} is not true`,
          ne(collectiviteTable.type, collectiviteTypeEnum.TEST),
          from ? gte(ficheActionTable.createdAt, from.toISOString()) : undefined
        )
      )
      .groupBy(sql`1`)
      .orderBy(sql`1`);
  }
}
