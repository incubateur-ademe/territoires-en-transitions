import { Injectable } from '@nestjs/common';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceTag } from '@tet/domain/collectivites';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { indicateurServiceTagTable } from './indicateur-service-tag.table';

type IndicateurServicesScope = Readonly<{
  indicateurId: number;
  collectiviteId: number;
}>;

type UpsertIndicateurServices = IndicateurServicesScope &
  Readonly<{ serviceIds: number[] }>;

@Injectable()
export class HandleDefinitionServicesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async areServicesOwnedByCollectivite(
    serviceIds: number[],
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const uniqueServiceIds = [...new Set(serviceIds)];
    if (uniqueServiceIds.length === 0) {
      return true;
    }

    const services = await (tx ?? this.databaseService.db)
      .select({ id: serviceTagTable.id })
      .from(serviceTagTable)
      .where(
        and(
          inArray(serviceTagTable.id, uniqueServiceIds),
          eq(serviceTagTable.collectiviteId, collectiviteId)
        )
      );

    return services.length === uniqueServiceIds.length;
  }

  listIndicateurServices({
    indicateurId,
    collectiviteId,
  }: IndicateurServicesScope): Promise<ServiceTag[]> {
    return this.databaseService.db
      .select({
        id: indicateurServiceTagTable.serviceTagId,
        collectiviteId: indicateurServiceTagTable.collectiviteId,
        nom: sql<string>`
          CASE
            WHEN ${serviceTagTable.nom} IS NOT NULL THEN ${serviceTagTable.nom}
            ELSE ''
          END
        `.as('nom'),
      })
      .from(indicateurServiceTagTable)
      .leftJoin(
        serviceTagTable,
        eq(serviceTagTable.id, indicateurServiceTagTable.serviceTagId)
      )
      .where(
        and(
          eq(indicateurServiceTagTable.indicateurId, indicateurId),
          eq(indicateurServiceTagTable.collectiviteId, collectiviteId)
        )
      )
      .groupBy(
        indicateurServiceTagTable.indicateurId,
        indicateurServiceTagTable.collectiviteId,
        indicateurServiceTagTable.serviceTagId,
        serviceTagTable.nom
      );
  }

  async upsertIndicateurServices(
    { indicateurId, collectiviteId, serviceIds }: UpsertIndicateurServices,
    tx?: Transaction
  ): Promise<void> {
    const writeDb = tx ?? this.databaseService.db;
    const scope = and(
      eq(indicateurServiceTagTable.indicateurId, indicateurId),
      eq(indicateurServiceTagTable.collectiviteId, collectiviteId)
    );
    await writeDb
      .delete(indicateurServiceTagTable)
      .where(
        serviceIds.length > 0
          ? and(
              scope,
              notInArray(indicateurServiceTagTable.serviceTagId, serviceIds)
            )
          : scope
      );

    if (serviceIds.length > 0) {
      await writeDb
        .insert(indicateurServiceTagTable)
        .values(
          serviceIds.map((serviceTagId) => ({
            serviceTagId,
            indicateurId,
            collectiviteId,
          }))
        )
        .onConflictDoNothing();
    }
  }
}
