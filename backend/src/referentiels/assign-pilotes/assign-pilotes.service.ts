import { Injectable, Logger } from '@nestjs/common';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { DatabaseService } from '../../utils/database/database.service';
import {
  actionPiloteTable,
  ActionPiloteType,
} from '../models/action-pilote.table';
import { personneTagTable } from '../../collectivites/index-domain';
import { dcpTable } from '../../auth/index-domain';

@Injectable()
export class AssignPilotesService {
  private readonly logger = new Logger(AssignPilotesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listPilotes(
    collectiviteId: number,
    actionId: string
  ): Promise<(ActionPiloteType & { nom: string | null })[]> {
    this.logger.log(
      `Récupération des pilotes pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    return await this.databaseService.db
      .select({
        collectiviteId: actionPiloteTable.collectiviteId,
        actionId: actionPiloteTable.actionId,
        userId: actionPiloteTable.userId,
        tagId: actionPiloteTable.tagId,
        nom: sql<
          string | null
        >`COALESCE(${dcpTable.nom}, ${personneTagTable.nom})`,
      })
      .from(actionPiloteTable)
      .leftJoin(
        personneTagTable,
        and(
          eq(personneTagTable.id, actionPiloteTable.tagId),
          isNull(actionPiloteTable.userId)
        )
      )
      .leftJoin(
        dcpTable,
        and(
          eq(dcpTable.userId, actionPiloteTable.userId),
          isNull(actionPiloteTable.tagId)
        )
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
    pilotes: { userId?: string; tagId?: number }[]
  ): Promise<(ActionPiloteType & { nom: string | null })[]> {
    if (pilotes.length === 0) {
      throw new Error('La liste des pilotes ne peut pas être vide');
    }

    await this.deletePilotes(collectiviteId, actionId);

    this.logger.log(
      `Mise à jour des pilotes pour la collectivité ${collectiviteId} et la mesure ${actionId}`
    );

    await this.databaseService.db.insert(actionPiloteTable).values(
      pilotes.map((pilote) => ({
        collectiviteId,
        actionId,
        userId: pilote.userId,
        tagId: pilote.tagId,
      }))
    );

    return await this.databaseService.db
      .select({
        collectiviteId: actionPiloteTable.collectiviteId,
        actionId: actionPiloteTable.actionId,
        userId: actionPiloteTable.userId,
        tagId: actionPiloteTable.tagId,
        nom: sql<
          string | null
        >`COALESCE(${dcpTable.nom}, ${personneTagTable.nom})`,
      })
      .from(actionPiloteTable)
      .leftJoin(
        personneTagTable,
        and(
          eq(personneTagTable.id, actionPiloteTable.tagId),
          isNull(actionPiloteTable.userId)
        )
      )
      .leftJoin(
        dcpTable,
        and(
          eq(dcpTable.userId, actionPiloteTable.userId),
          isNull(actionPiloteTable.tagId)
        )
      )
      .where(
        and(
          eq(actionPiloteTable.collectiviteId, collectiviteId),
          eq(actionPiloteTable.actionId, actionId)
        )
      );
  }

  async deletePilotes(collectiviteId: number, actionId: string): Promise<void> {
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
