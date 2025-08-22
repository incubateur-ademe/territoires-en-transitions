import { indicateurThematiqueTable } from '@/backend/indicateurs/shared/models/indicateur-thematique.table';
import { UpdateIndicateurService } from '@/backend/indicateurs/update-indicateur/update-indicateur.service';
import { thematiqueTable } from '@/backend/shared/index-domain';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser, PermissionOperationEnum, ResourceType } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class IndicateurThematiqueService {
  private readonly logger = new Logger(IndicateurThematiqueService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly updateIndicateurService: UpdateIndicateurService,
    private readonly permissionService: PermissionService
  ) { }

  async getIndicateurThematiques({ indicateurId, collectiviteId, tokenInfo }: { indicateurId: number; collectiviteId: number; tokenInfo: AuthUser; }) {

    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Récupération des thematiques de l'indicateur dont l'id est ${indicateurId}`);

    const indicateurThematiques = await this.databaseService.db
      .select({ ids: indicateurThematiqueTable.thematiqueId })
      .from(indicateurThematiqueTable)
      .leftJoin(thematiqueTable, eq(thematiqueTable.id, indicateurThematiqueTable.thematiqueId))
      .where(and(
        eq(indicateurThematiqueTable.indicateurId, indicateurId),
      ))
      .groupBy(indicateurThematiqueTable.indicateurId, indicateurThematiqueTable.thematiqueId);
    return indicateurThematiques.map(t => t.ids);
  }

  async upsertIndicateurThematique({
    indicateurId,
    collectiviteId,
    indicateurThematiqueIds,
    tokenInfo
  }: {
    indicateurId: number;
    collectiviteId: number;
    indicateurThematiqueIds: number[];
    tokenInfo: AuthUser;
  }) {



    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Mise à jour des thematiques de l'indicateur dont l'id est ${indicateurId}`);


    await this.databaseService.db
      .delete(indicateurThematiqueTable)
      .where(eq(indicateurThematiqueTable.indicateurId, indicateurId));

    if (indicateurThematiqueIds.length > 0) {
      await this.databaseService.db
        .insert(indicateurThematiqueTable)
        .values(indicateurThematiqueIds.map((thematiqueId) => ({
          thematiqueId,
          indicateurId,
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
