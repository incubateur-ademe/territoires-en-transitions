import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { UpsertIndicateurDefinitionPiloteRequest } from '@/backend/indicateurs/definitions/handle-definition-pilotes/handle-definition-pilotes.request';
import { UpdateIndicateurDefinitionsService } from '@/backend/indicateurs/definitions/update-definitions/update-definitions.service';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';

@Injectable()
export class HandleDefinitionPilotesService {
  private readonly logger = new Logger(HandleDefinitionPilotesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly updateIndicateurService: UpdateIndicateurDefinitionsService,
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

  async upsertIndicateurPilote({
    indicateurId,
    collectiviteId,
    indicateurPilotes,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    indicateurPilotes: UpsertIndicateurDefinitionPiloteRequest[];
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

    await this.databaseService.db
      .delete(indicateurPiloteTable)
      .where(
        and(
          eq(indicateurPiloteTable.indicateurId, indicateurId),
          eq(indicateurPiloteTable.collectiviteId, collectiviteId)
        )
      );

    if (indicateurPilotes.length > 0) {
      await this.databaseService.db.insert(indicateurPiloteTable).values(
        indicateurPilotes.map((indicateurPilote) => ({
          ...indicateurPilote,
          indicateurId,
          collectiviteId,
        }))
      );
    }

    // update indicateur definition modifiedBy field
    await this.updateIndicateurService.updateIndicateur({
      indicateurId: indicateurId,
      indicateurFields: {
        modifiedBy: user.id,
        collectiviteId,
      },
      user,
    });
  }
}
