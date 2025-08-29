import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { UpdateIndicateurDefinitionService } from '@/backend/indicateurs/definitions/update-indicateur-definition.service';
import { UpsertIndicateurDefinitionPiloteRequest } from '@/backend/indicateurs/index-domain';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser, PermissionOperationEnum, ResourceType } from '@/backend/users/index-domain';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';

@Injectable()
export class IndicateurDefinitionPiloteService {
  private readonly logger = new Logger(IndicateurDefinitionPiloteService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly updateIndicateurService: UpdateIndicateurDefinitionService,
    private readonly permissionService: PermissionService
  ) { }

  async getIndicateurPilotes({ indicateurId, collectiviteId, tokenInfo }: { indicateurId: number; collectiviteId: number; tokenInfo: AuthUser; }) {

    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Récupération des pilotes de l'indicateur dont l'id est ${indicateurId}`);

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
      .where(and(
        eq(indicateurPiloteTable.indicateurId, indicateurId),
        eq(indicateurPiloteTable.collectiviteId, collectiviteId),
      )).groupBy(indicateurPiloteTable.id, dcpTable.prenom, dcpTable.nom, personneTagTable.nom);
    return indicateurPilotes;
  }

  async upsertIndicateurPilote({
    indicateurId,
    collectiviteId,
    indicateurPilotes,
    tokenInfo
  }: {
    indicateurId: number;
    collectiviteId: number;
    indicateurPilotes: UpsertIndicateurDefinitionPiloteRequest[];
    tokenInfo: AuthUser;
  }) {



    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Mise à jour des pilotes de l'indicateur dont l'id est ${indicateurId}`);


    await this.databaseService.db
      .delete(indicateurPiloteTable)
      .where(and(
        eq(indicateurPiloteTable.indicateurId, indicateurId),
        eq(indicateurPiloteTable.collectiviteId, collectiviteId),
      ));

    if (indicateurPilotes.length > 0) {
      await this.databaseService.db
        .insert(indicateurPiloteTable)
        .values(indicateurPilotes.map((indicateurPilote) => ({
          ...indicateurPilote,
          indicateurId,
          collectiviteId,
        })));
    }


    // update indicateur definition modifiedBy field
    await this.updateIndicateurService.updateIndicateur({
      indicateurId: indicateurId,
      indicateurFields: {
        modifiedBy: tokenInfo.id,
        collectiviteId
      },
      tokenInfo
    });
  }
}
