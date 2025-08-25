import { serviceTagTable } from '@/backend/collectivites/index-domain';
import { indicateurServiceTagTable } from '@/backend/indicateurs/shared/models/indicateur-service-tag.table';
import { UpdateIndicateurService } from '@/backend/indicateurs/update-indicateur/update-indicateur.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser, PermissionOperationEnum, ResourceType } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';

@Injectable()
export class IndicateurServicePiloteService {
  private readonly logger = new Logger(IndicateurServicePiloteService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly updateIndicateurService: UpdateIndicateurService,
    private readonly permissionService: PermissionService
  ) { }

  async getIndicateurServicesPilotes({ indicateurId, collectiviteId, tokenInfo }: { indicateurId: number; collectiviteId: number; tokenInfo: AuthUser; }) {

    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Récupération des services pilotes de l'indicateur dont l'id est ${indicateurId}`);

    const indicateurServicesPilotes = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurServiceTagTable),
        nom: sql<string>`

                      ${serviceTagTable.nom}


                `.as('nom'),
      })
      .from(indicateurServiceTagTable)
      .leftJoin(serviceTagTable, eq(serviceTagTable.id, indicateurServiceTagTable.serviceTagId))
      .where(and(
        eq(indicateurServiceTagTable.indicateurId, indicateurId),
        eq(indicateurServiceTagTable.collectiviteId, collectiviteId),
      )).groupBy(indicateurServiceTagTable.indicateurId, indicateurServiceTagTable.collectiviteId, indicateurServiceTagTable.serviceTagId, serviceTagTable.nom);
    console.log('GET INDICATEUR ::::: ', indicateurServicesPilotes)
    return indicateurServicesPilotes;
  }

  async upsertIndicateurServicePilote({
    indicateurId,
    collectiviteId,
    indicateurServicesPilotesIds,
    tokenInfo
  }: {
    indicateurId: number;
    collectiviteId: number;
    indicateurServicesPilotesIds: number[];
    tokenInfo: AuthUser;
  }) {



    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Mise à jour des servicespilotes de l'indicateur dont l'id est ${indicateurId}`);


    await this.databaseService.db
      .delete(indicateurServiceTagTable)
      .where(and(
        eq(indicateurServiceTagTable.indicateurId, indicateurId),
        eq(indicateurServiceTagTable.collectiviteId, collectiviteId),
      ));

    if (indicateurServicesPilotesIds.length > 0) {
      await this.databaseService.db
        .insert(indicateurServiceTagTable)
        .values(indicateurServicesPilotesIds.map((serviceTagId) => ({
          serviceTagId,
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
