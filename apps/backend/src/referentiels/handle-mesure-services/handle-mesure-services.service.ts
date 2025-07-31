import { serviceTagTable } from '@/backend/collectivites/tags/service-tag.table';
import { Tag } from '@/backend/collectivites/tags/tag.table-base';
import { MesureId } from '@/backend/referentiels/models/action-definition.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { PermissionService } from '../../users/authorizations/permission.service';
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
    mesureIds?: MesureId[],
    tx?: Transaction
  ): Promise<Record<MesureId, Tag[]>> {
    this.logger.log(this.formatServicesLog(collectiviteId, mesureIds));

    const db = tx || this.databaseService.db;

    const conditions = [eq(actionServiceTable.collectiviteId, collectiviteId)];
    if (mesureIds && mesureIds.length > 0) {
      conditions.push(inArray(actionServiceTable.actionId, mesureIds));
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

    const servicesByMesureId: Record<MesureId, Tag[]> = {};
    for (const service of services) {
      if (!servicesByMesureId[service.actionId]) {
        servicesByMesureId[service.actionId] = [];
      }
      servicesByMesureId[service.actionId].push({
        id: service.id,
        nom: service.nom,
        collectiviteId: service.collectiviteId,
      });
    }

    return servicesByMesureId;
  }

  async upsertServices(
    collectiviteId: number,
    mesureId: MesureId,
    services: { serviceTagId: number }[],
    tokenInfo: AuthUser
  ): Promise<Record<MesureId, Tag[]>> {
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
      `Mise à jour des services pour la collectivité ${collectiviteId} et la mesure ${mesureId}`
    );

    return await this.databaseService.db.transaction(async (tx) => {
      await tx
        .delete(actionServiceTable)
        .where(
          and(
            eq(actionServiceTable.collectiviteId, collectiviteId),
            eq(actionServiceTable.actionId, mesureId)
          )
        );

      await tx.insert(actionServiceTable).values(
        services.map((service) => ({
          collectiviteId,
          actionId: mesureId,
          serviceTagId: service.serviceTagId,
        }))
      );

      return await this.listServices(collectiviteId, [mesureId], tx);
    });
  }

  async deleteServices(
    collectiviteId: number,
    mesureId: MesureId,
    tokenInfo: AuthUser
  ): Promise<void> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Suppression des services pour la collectivité ${collectiviteId} et la mesure ${mesureId}`
    );

    await this.databaseService.db
      .delete(actionServiceTable)
      .where(
        and(
          eq(actionServiceTable.collectiviteId, collectiviteId),
          eq(actionServiceTable.actionId, mesureId)
        )
      );
  }

  private formatServicesLog(
    collectiviteId: number,
    mesureIds?: MesureId[]
  ): string {
    if (!mesureIds || mesureIds.length === 0) {
      return `Récupération de tous les services pour la collectivité ${collectiviteId}`;
    }
    const nbMesures = mesureIds.length;
    if (nbMesures > 10) {
      return `Récupération des services pour la collectivité ${collectiviteId} (${nbMesures} mesures)`;
    }
    return `Récupération des services pour la collectivité ${collectiviteId} (${nbMesures} mesure(s): ${mesureIds.join(
      ', '
    )})`;
  }
}
