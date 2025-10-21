import {
  ServiceTag,
  serviceTagTable,
} from '@/backend/collectivites/tags/service-tag.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import { PermissionOperationEnum } from '../../../users/authorizations/permission-operation.enum';
import { ResourceType } from '../../../users/authorizations/resource-type.enum';
import { indicateurServiceTagTable } from './indicateur-service-tag.table';

@Injectable()
export class HandleDefinitionServicesService {
  private readonly logger = new Logger(HandleDefinitionServicesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listIndicateurServices({
    indicateurId,
    collectiviteId,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    user: AuthUser;
  }): Promise<ServiceTag[]> {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des services pilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    const indicateurServicesPilotes = await this.databaseService.db
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

    return indicateurServicesPilotes;
  }

  async upsertIndicateurServices({
    indicateurId,
    collectiviteId,
    serviceIds,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    serviceIds: number[];
    user: AuthUser;
  }) {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Mise à jour des servicespilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    await this.databaseService.db.transaction(async (tx) => {
      // Delete all services not in the new list
      const indicateurIdCondition = eq(
        indicateurServiceTagTable.indicateurId,
        indicateurId
      );
      const collectiviteIdCondition = eq(
        indicateurServiceTagTable.collectiviteId,
        collectiviteId
      );

      const deleteConditions =
        serviceIds.length > 0
          ? and(
              indicateurIdCondition,
              collectiviteIdCondition,
              notInArray(indicateurServiceTagTable.serviceTagId, serviceIds)
            )
          : and(indicateurIdCondition, collectiviteIdCondition);

      await tx.delete(indicateurServiceTagTable).where(deleteConditions);

      // Insert all services (PostgreSQL will ignore duplicates)
      if (serviceIds.length > 0) {
        await tx
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
    });
  }
}
