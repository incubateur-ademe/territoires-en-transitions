import { Transaction } from '@/backend/utils/database/transaction.utils';
import { getErrorMessage } from '@/backend/utils/nest/errors.utils';
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

  private async queryPilotes(
    collectiviteId: number,
    actionIds: string | string[],
    tx?: Transaction
  ) {
    const db = tx || this.databaseService.db;
    const isBatch = Array.isArray(actionIds);

    return await db
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
      .where(
        and(
          eq(actionPiloteTable.collectiviteId, collectiviteId),
          isBatch
            ? inArray(actionPiloteTable.actionId, actionIds)
            : eq(actionPiloteTable.actionId, actionIds)
        )
      );
  }

  async listPilotes(
    collectiviteId: number,
    actionId: string,
    tx?: Transaction
  ): Promise<PersonneTagOrUser[]> {
    this.logger.log(
      `Récupération des pilotes pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    return await this.queryPilotes(collectiviteId, actionId, tx);
  }

  async batchListPilotes(
    collectiviteId: number,
    actionIds: string[],
    tx?: Transaction
  ): Promise<Map<string, PersonneTagOrUser[]>> {
    this.logger.log(
      `Récupération des pilotes pour la collectivité ${collectiviteId} et les mesures données`
    );

    try {
      const pilotes = await this.queryPilotes(collectiviteId, actionIds, tx);

      const pilotesMap = new Map<string, PersonneTagOrUser[]>();
      for (const pilote of pilotes) {
        const existingPilotes = pilotesMap.get(pilote.actionId) || [];
        pilotesMap.set(pilote.actionId, [
          ...existingPilotes,
          {
            nom: pilote.nom,
            userId: pilote.userId ?? undefined,
            tagId: pilote.tagId ?? undefined,
          },
        ]);
      }

      return pilotesMap;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des pilotes: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async upsertPilotes(
    collectiviteId: number,
    actionId: string,
    pilotes: { userId?: string; tagId?: number }[],
    tokenInfo: AuthUser
  ): Promise<PersonneTagOrUser[]> {
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

      return await this.listPilotes(collectiviteId, actionId, tx);
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
}
