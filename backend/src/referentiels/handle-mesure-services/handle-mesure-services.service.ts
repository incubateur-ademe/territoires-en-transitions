import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { PermissionService } from '../../auth/authorizations/permission.service';
import {
  AuthUser,
  PermissionOperationEnum,
  ResourceType,
} from '../../auth/index-domain';
import { serviceTagTable, Tag } from '../../collectivites/index-domain';
import { DatabaseService } from '../../utils/database/database.service';
import { actionServiceTable } from '../models/action-service.table';

@Injectable()
export class HandleMesureServicesService {
  private readonly logger = new Logger(HandleMesureServicesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listServices(
    collectiviteId: number,
    actionIds?: string[],
    tx?: Transaction
  ): Promise<Record<string, Tag[]>> {
    this.logger.log(this.formatServicesLog(collectiviteId, actionIds));

    const db = tx || this.databaseService.db;

    const conditions = [eq(actionServiceTable.collectiviteId, collectiviteId)];
    if (actionIds && actionIds.length > 0) {
      conditions.push(inArray(actionServiceTable.actionId, actionIds));
    }

    const services = await db
      .select({
        collectiviteId: actionServiceTable.collectiviteId,
        actionId: actionServiceTable.actionId,
        id: actionServiceTable.serviceTagId,
        nom: serviceTagTable.nom,
      })
      .from(actionServiceTable)
      .innerJoin(
        serviceTagTable,
        eq(serviceTagTable.id, actionServiceTable.serviceTagId)
      )
      .where(and(...conditions));

    const servicesByActionId: Record<string, Tag[]> = {};
    for (const service of services) {
      if (!servicesByActionId[service.actionId]) {
        servicesByActionId[service.actionId] = [];
      }
      servicesByActionId[service.actionId].push({
        id: service.id,
        nom: service.nom,
        collectiviteId: service.collectiviteId,
      });
    }

    return servicesByActionId;
  }

  async upsertServices(
    collectiviteId: number,
    actionId: string,
    services: { serviceTagId: number }[],
    tokenInfo: AuthUser
  ): Promise<Record<string, Tag[]>> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.EDITION'],
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

      return await this.listServices(collectiviteId, [actionId], tx);
    });
  }

  async deleteServices(
    collectiviteId: number,
    actionId: string,
    tokenInfo: AuthUser
  ): Promise<void> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.EDITION'],
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

  private formatServicesLog(
    collectiviteId: number,
    actionIds?: string[]
  ): string {
    if (!actionIds || actionIds.length === 0) {
      return `Récupération de tous les services pour la collectivité ${collectiviteId}`;
    }
    const nbMesures = actionIds.length;
    if (nbMesures > 10) {
      return `Récupération des services pour la collectivité ${collectiviteId} (${nbMesures} mesures)`;
    }
    return `Récupération des services pour la collectivité ${collectiviteId} (${nbMesures} mesure(s): ${actionIds.join(
      ', '
    )})`;
  }
}
