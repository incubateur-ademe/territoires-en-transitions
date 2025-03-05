import { Injectable, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../../utils/database/database.service';
import {
  actionServiceTable,
  ActionServiceType,
} from '../models/action-service.table';
import { serviceTagTable } from '../../collectivites/index-domain';

@Injectable()
export class AssignServicesService {
  private readonly logger = new Logger(AssignServicesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listServices(
    collectiviteId: number,
    actionId: string
  ): Promise<(ActionServiceType & { nom: string | null })[]> {
    this.logger.log(
      `Récupération des services pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    return await this.databaseService.db
      .select({
        collectiviteId: actionServiceTable.collectiviteId,
        actionId: actionServiceTable.actionId,
        serviceTagId: actionServiceTable.serviceTagId,
        nom: serviceTagTable.nom,
      })
      .from(actionServiceTable)
      .leftJoin(
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
    services: { serviceTagId: number }[]
  ): Promise<(ActionServiceType & { nom: string | null })[]> {
    if (services.length === 0) {
      throw new Error('La liste des services ne peut pas être vide');
    }

    await this.deleteServices(collectiviteId, actionId);

    this.logger.log(
      `Mise à jour des services pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    await this.databaseService.db.insert(actionServiceTable).values(
      services.map((service) => ({
        collectiviteId,
        actionId,
        serviceTagId: service.serviceTagId,
      }))
    );

    return await this.databaseService.db
      .select({
        collectiviteId: actionServiceTable.collectiviteId,
        actionId: actionServiceTable.actionId,
        serviceTagId: actionServiceTable.serviceTagId,
        nom: serviceTagTable.nom,
      })
      .from(actionServiceTable)
      .leftJoin(
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

  async deleteServices(
    collectiviteId: number,
    actionId: string
  ): Promise<void> {
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
