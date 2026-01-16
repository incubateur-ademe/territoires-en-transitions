import { Injectable, Logger } from '@nestjs/common';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { ActionId } from '@tet/domain/referentiels';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { PermissionService } from '../../users/authorizations/permission.service';
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
    mesureIds?: ActionId[],
    tx?: Transaction
  ): Promise<Record<ActionId, PersonneTagOrUser[]>> {
    this.logger.log(this.formatMesuresLog(collectiviteId, mesureIds));

    const db = tx || this.databaseService.db;

    const conditions = [eq(actionPiloteTable.collectiviteId, collectiviteId)];
    if (mesureIds && mesureIds.length > 0) {
      conditions.push(inArray(actionPiloteTable.actionId, mesureIds));
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
      .leftJoin(dcpTable, eq(dcpTable.id, actionPiloteTable.userId))
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, actionPiloteTable.tagId)
      )
      .where(and(...conditions));

    const pilotesByMesureId: Record<ActionId, PersonneTagOrUser[]> = {};
    for (const pilote of pilotes) {
      if (!pilotesByMesureId[pilote.actionId]) {
        pilotesByMesureId[pilote.actionId] = [];
      }
      pilotesByMesureId[pilote.actionId].push({
        nom: pilote.nom,
        userId: pilote.userId,
        tagId: pilote.tagId,
      });
    }

    return pilotesByMesureId;
  }

  async upsertPilotes(
    collectiviteId: number,
    mesureId: ActionId,
    pilotes: { userId?: string | null; tagId?: number | null }[],
    tokenInfo: AuthUser
  ): Promise<Record<ActionId, PersonneTagOrUser[]>> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    if (pilotes.length === 0) {
      throw new Error('La liste des pilotes ne peut pas être vide');
    }

    this.logger.log(
      `Mise à jour des pilotes pour la collectivité ${collectiviteId} et la mesure ${mesureId}`
    );

    return await this.databaseService.db.transaction(async (tx) => {
      await tx
        .delete(actionPiloteTable)
        .where(
          and(
            eq(actionPiloteTable.collectiviteId, collectiviteId),
            eq(actionPiloteTable.actionId, mesureId)
          )
        );

      await tx.insert(actionPiloteTable).values(
        pilotes.map((pilote) => ({
          collectiviteId,
          actionId: mesureId,
          userId: pilote.userId,
          tagId: pilote.tagId,
        }))
      );

      return await this.listPilotes(collectiviteId, undefined, tx);
    });
  }

  async deletePilotes(
    collectiviteId: number,
    mesureId: ActionId,
    tokenInfo: AuthUser
  ): Promise<void> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['REFERENTIELS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Suppression des pilotes pour la collectivité ${collectiviteId} et la mesure ${mesureId}`
    );

    await this.databaseService.db
      .delete(actionPiloteTable)
      .where(
        and(
          eq(actionPiloteTable.collectiviteId, collectiviteId),
          eq(actionPiloteTable.actionId, mesureId)
        )
      );
  }

  private formatMesuresLog(
    collectiviteId: number,
    mesureIds?: ActionId[]
  ): string {
    if (!mesureIds || mesureIds.length === 0) {
      return `Récupération de tous les pilotes pour la collectivité ${collectiviteId}`;
    }
    const nbMesures = mesureIds.length;
    if (nbMesures > 10) {
      return `Récupération des pilotes pour la collectivité ${collectiviteId} (${nbMesures} mesures)`;
    }
    return `Récupération des pilotes pour la collectivité ${collectiviteId} (${nbMesures} mesure(s): ${mesureIds.join(
      ', '
    )})`;
  }
}
