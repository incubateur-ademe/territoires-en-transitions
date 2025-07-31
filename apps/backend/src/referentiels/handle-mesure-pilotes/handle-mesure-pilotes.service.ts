import { PersonneTagOrUser } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { MesureId } from '@/backend/referentiels/models/action-definition.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
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
    mesureIds?: MesureId[],
    tx?: Transaction
  ): Promise<Record<MesureId, PersonneTagOrUser[]>> {
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
      .leftJoin(dcpTable, eq(dcpTable.userId, actionPiloteTable.userId))
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, actionPiloteTable.tagId)
      )
      .where(and(...conditions));

    const pilotesByMesureId: Record<MesureId, PersonneTagOrUser[]> = {};
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
    mesureId: MesureId,
    pilotes: { userId?: string | null; tagId?: number | null }[],
    tokenInfo: AuthUser
  ): Promise<Record<MesureId, PersonneTagOrUser[]>> {
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
    mesureIds?: MesureId[]
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
