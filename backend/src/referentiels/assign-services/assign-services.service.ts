import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PermissionService } from '../../auth/authorizations/permission.service';
import {
  AuthUser,
  PermissionOperation,
  ResourceType,
} from '../../auth/index-domain';
import { serviceTagTable, Tag } from '../../collectivites/index-domain';
import { DatabaseService } from '../../utils/database/database.service';
import { actionServiceTable } from '../models/action-service.table';

@Injectable()
export class AssignServicesService {
  private readonly logger = new Logger(AssignServicesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listServices(collectiviteId: number, actionId: string): Promise<Tag[]> {
    this.logger.log(
      `Récupération des services pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    return await this.databaseService.db
      .select({
        collectiviteId: actionServiceTable.collectiviteId,
        id: actionServiceTable.serviceTagId,
        nom: serviceTagTable.nom,
      })
      .from(actionServiceTable)
      .innerJoin(
        serviceTagTable,
        eq(serviceTagTable.id, actionServiceTable.serviceTagId)
      )
      .where(
        and(
          eq(actionServiceTable.collectiviteId, collectiviteId),
          eq(actionServiceTable.actionId, actionId)
        )
      );
  }

  async upsertServices(
    collectiviteId: number,
    actionId: string,
    services: { serviceTagId: number }[],
    tokenInfo: AuthUser
  ): Promise<Tag[]> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.REFERENTIELS_EDITION,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    if (services.length === 0) {
      throw new Error('La liste des services ne peut pas être vide');
    }

    this.logger.log(
      `Mise à jour des services pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    return await this.databaseService.db.transaction(async (tx) => {
      await tx
        .delete(actionServiceTable)
        .where(
          and(
            eq(actionServiceTable.collectiviteId, collectiviteId),
            eq(actionServiceTable.actionId, actionId)
          )
        );

      await tx.insert(actionServiceTable).values(
        services.map((service) => ({
          collectiviteId,
          actionId,
          serviceTagId: service.serviceTagId,
        }))
      );

      return await this.listServices(collectiviteId, actionId);
    });
  }

  async deleteServices(
    collectiviteId: number,
    actionId: string,
    tokenInfo: AuthUser
  ): Promise<void> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.REFERENTIELS_EDITION,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Suppression des services pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    await this.databaseService.db
      .delete(actionServiceTable)
      .where(
        and(
          eq(actionServiceTable.collectiviteId, collectiviteId),
          eq(actionServiceTable.actionId, actionId)
        )
      );
  }
}
