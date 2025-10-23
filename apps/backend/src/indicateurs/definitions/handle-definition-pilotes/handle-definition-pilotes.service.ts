import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, inArray, not, sql } from 'drizzle-orm';
import { UpsertIndicateurDefinitionPilotesInput } from './handle-definition-pilotes.input';

@Injectable()
export class HandleDefinitionPilotesService {
  private readonly logger = new Logger(HandleDefinitionPilotesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listIndicateurPilotes({
    indicateurId,
    collectiviteId,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    user: AuthUser;
  }) {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des pilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    const indicateurPilotes = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurPiloteTable),
        nom: sql<string>`

                      CASE
                        WHEN ${indicateurPiloteTable.userId} IS NOT NULL THEN
                          CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
                        WHEN ${indicateurPiloteTable.tagId} IS NOT NULL THEN
                          ${personneTagTable.nom}
                      END

                `.as('nom'),
      })
      .from(indicateurPiloteTable)
      .leftJoin(dcpTable, eq(dcpTable.userId, indicateurPiloteTable.userId))
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, indicateurPiloteTable.tagId)
      )
      .where(
        and(
          eq(indicateurPiloteTable.indicateurId, indicateurId),
          eq(indicateurPiloteTable.collectiviteId, collectiviteId)
        )
      )
      .groupBy(
        indicateurPiloteTable.id,
        dcpTable.prenom,
        dcpTable.nom,
        personneTagTable.nom
      );
    return indicateurPilotes;
  }

  async upsertIndicateurPilotes({
    indicateurId,
    collectiviteId,
    pilotes,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    pilotes: UpsertIndicateurDefinitionPilotesInput[];
    user: AuthUser;
  }) {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Mise à jour des pilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    await this.databaseService.db.transaction(async (tx) => {
      const { userIds, tagIds } = pilotes.reduce(
        (acc, pilote) => {
          if (pilote.userId) {
            return { ...acc, userIds: [...acc.userIds, pilote.userId] };
          }
          if (pilote.tagId) {
            return { ...acc, tagIds: [...acc.tagIds, pilote.tagId] };
          }
          return acc;
        },
        {
          userIds: new Array<string>(),
          tagIds: new Array<number>(),
        }
      );

      const keepExistingPiloteTagsCondition =
        tagIds.length > 0
          ? not(inArray(indicateurPiloteTable.tagId, tagIds))
          : undefined;

      const keepExistingPiloteUserIdsCondition =
        userIds.length > 0
          ? not(inArray(indicateurPiloteTable.userId, userIds))
          : undefined;

      const deleteConditions = [
        eq(indicateurPiloteTable.indicateurId, indicateurId),
        eq(indicateurPiloteTable.collectiviteId, collectiviteId),
        keepExistingPiloteTagsCondition,
        keepExistingPiloteUserIdsCondition,
      ];

      await tx.delete(indicateurPiloteTable).where(and(...deleteConditions));

      // Insert new pilotes (PostgreSQL will ignore duplicates due to unique constraints)
      if (pilotes.length > 0) {
        await tx
          .insert(indicateurPiloteTable)
          .values(
            pilotes.map((indicateurPilote) => ({
              ...indicateurPilote,
              indicateurId,
              collectiviteId,
            }))
          )
          .onConflictDoNothing();
      }
    });
  }
}
