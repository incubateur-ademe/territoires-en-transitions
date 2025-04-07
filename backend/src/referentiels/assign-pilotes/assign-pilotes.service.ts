import { Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { PermissionService } from '../../auth/authorizations/permission.service';
import {
  AuthUser,
  dcpTable,
  PermissionOperation,
  ResourceType,
} from '../../auth/index-domain';
import {
  PersonneTagOrUser,
  personneTagTable,
} from '../../collectivites/index-domain';
import { DatabaseService } from '../../utils/database/database.service';
import { actionPiloteTable } from '../models/action-pilote.table';

@Injectable()
export class AssignPilotesService {
  private readonly logger = new Logger(AssignPilotesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listPilotes(
    collectiviteId: number,
    actionId: string
  ): Promise<PersonneTagOrUser[]> {
    this.logger.log(
      `Récupération des pilotes pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    return await this.databaseService.db
      .select({
        collectiviteId: actionPiloteTable.collectiviteId,
        actionId: actionPiloteTable.actionId,
        userId: actionPiloteTable.userId,
        tagId: actionPiloteTable.tagId,
        nom: sql<string | null>`
          CASE
            WHEN ${actionPiloteTable.userId} IS NOT NULL THEN CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
            ELSE ${personneTagTable.nom}
          END
        `,
      })
      .from(actionPiloteTable)
      .leftJoin(dcpTable, eq(dcpTable.userId, actionPiloteTable.userId))
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, actionPiloteTable.tagId)
      )
      .where(
        and(
          eq(actionPiloteTable.collectiviteId, collectiviteId),
          eq(actionPiloteTable.actionId, actionId)
        )
      );
  }

  async upsertPilotes(
    collectiviteId: number,
    actionId: string,
    pilotes: { userId?: string; tagId?: number }[],
    tokenInfo: AuthUser
  ): Promise<PersonneTagOrUser[]> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.REFERENTIELS_EDITION,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    if (pilotes.length === 0) {
      throw new Error('La liste des pilotes ne peut pas être vide');
    }

    this.logger.log(
      `Mise à jour des pilotes pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    return await this.databaseService.db.transaction(async (tx) => {
      await tx
        .delete(actionPiloteTable)
        .where(
          and(
            eq(actionPiloteTable.collectiviteId, collectiviteId),
            eq(actionPiloteTable.actionId, actionId)
          )
        );

      await tx.insert(actionPiloteTable).values(
        pilotes.map((pilote) => ({
          collectiviteId,
          actionId,
          userId: pilote.userId,
          tagId: pilote.tagId,
        }))
      );

      return await this.listPilotes(collectiviteId, actionId);
    });
  }

  async deletePilotes(
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
      `Suppression des pilotes pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    await this.databaseService.db
      .delete(actionPiloteTable)
      .where(
        and(
          eq(actionPiloteTable.collectiviteId, collectiviteId),
          eq(actionPiloteTable.actionId, actionId)
        )
      );
  }
}
