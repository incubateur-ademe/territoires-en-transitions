

import { UpdateIndicateursDefinitionsService } from '@/backend/indicateurs/definitions/update-indicateurs-definitions/update-indicateurs-definitions.service';
import { indicateurThematiqueTable } from '@/backend/indicateurs/shared/models/indicateur-thematique.table';
import { Thematique, thematiqueTable } from '@/backend/shared/index-domain';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser, PermissionOperationEnum, ResourceType } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';

@Injectable()
export class IndicateursDefinitionsThematiquesService {
  private readonly logger = new Logger(IndicateursDefinitionsThematiquesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly updateIndicateurService: UpdateIndicateursDefinitionsService,
    private readonly permissionService: PermissionService
  ) { }

  async getIndicateurThematique({ indicateurId, collectiviteId, user }: { indicateurId: number; collectiviteId: number; user: AuthUser; }): Promise<Thematique[]> {

    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Récupération des thematiques de l'indicateur dont l'id est ${indicateurId}`);

    const indicateurThematiques = await this.databaseService.db
      .select({ id: thematiqueTable.id, nom: thematiqueTable.nom })
      .from(thematiqueTable)
      .leftJoin(indicateurThematiqueTable, eq(thematiqueTable.id, indicateurThematiqueTable.thematiqueId))
      .where(and(
        eq(indicateurThematiqueTable.indicateurId, indicateurId),
      )).orderBy(
        asc(thematiqueTable.nom)
      )
    return indicateurThematiques;
  }

  async upsertIndicateurThematique({
    indicateurId,
    collectiviteId,
    indicateurThematiqueIds,
    user
  }: {
    indicateurId: number;
    collectiviteId: number;
    indicateurThematiqueIds: number[];
    user: AuthUser;
  }) {



    await this.permissionService.isAllowed(
      user,
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
        modifiedBy: user.id,
        collectiviteId
      },
      user
    });
  }
}
