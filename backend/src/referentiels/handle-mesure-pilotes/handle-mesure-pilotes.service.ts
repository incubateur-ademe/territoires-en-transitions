import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { PermissionService } from '../../auth/authorizations/permission.service';
import {
  AuthUser,
  dcpTable,
  PermissionOperationEnum,
  ResourceType,
} from '../../auth/index-domain';
import {
  PersonneTagOrUser,
  personneTagTable,
} from '../../collectivites/index-domain';
import { DatabaseService } from '../../utils/database/database.service';
import { actionPiloteTable } from '../models/action-pilote.table';

@Injectable()
export class HandleMesurePilotesService {
  private readonly logger = new Logger(HandleMesurePilotesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listPilotes(
    collectiviteId: number,
    actionIds?: string[],
    tx?: Transaction
  ): Promise<Record<string, PersonneTagOrUser[]>> {
    this.logger.log(this.formatMesuresLog(collectiviteId, actionIds));

    const db = tx || this.databaseService.db;

    const conditions = [eq(actionPiloteTable.collectiviteId, collectiviteId)];
    if (actionIds && actionIds.length > 0) {
      conditions.push(inArray(actionPiloteTable.actionId, actionIds));
    }

    const pilotes = await db
      .select({
        collectiviteId: actionPiloteTable.collectiviteId,
        actionId: actionPiloteTable.actionId,
        userId: actionPiloteTable.userId,
        tagId: actionPiloteTable.tagId,
        nom: sql<string>`
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
      .where(and(...conditions));

    const pilotesByActionId: Record<string, PersonneTagOrUser[]> = {};
    for (const pilote of pilotes) {
      if (!pilotesByActionId[pilote.actionId]) {
        pilotesByActionId[pilote.actionId] = [];
      }
      pilotesByActionId[pilote.actionId].push({
        nom: pilote.nom,
        userId: pilote.userId,
        tagId: pilote.tagId,
      });
    }

    return pilotesByActionId;
  }

  async upsertPilotes(
    collectiviteId: number,
    actionId: string,
    pilotes: { userId?: string | null; tagId?: number | null }[],
    tokenInfo: AuthUser
  ): Promise<Record<string, PersonneTagOrUser[]>> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.EDITION'],
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

      return await this.listPilotes(collectiviteId, undefined, tx);
    });
  }

  async deletePilotes(
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

  private formatMesuresLog(
    collectiviteId: number,
    actionIds?: string[]
  ): string {
    if (!actionIds || actionIds.length === 0) {
      return `Récupération de tous les pilotes pour la collectivité ${collectiviteId}`;
    }
    const nbMesures = actionIds.length;
    if (nbMesures > 10) {
      return `Récupération des pilotes pour la collectivité ${collectiviteId} (${nbMesures} mesures)`;
    }
    return `Récupération des pilotes pour la collectivité ${collectiviteId} (${nbMesures} mesure(s): ${actionIds.join(
      ', '
    )})`;
  }
}
