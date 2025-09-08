import { serviceTagTable } from '@/backend/collectivites/tags/service-tag.table';
import { IndicateurDefinitionServiceTag } from '@/backend/indicateurs/definitions/handle-definition-services/handle-definition-services.request';
import { UpdateIndicateurDefinitionsService } from '@/backend/indicateurs/definitions/update-definitions/update-definitions.service';
import { indicateurServiceTagTable } from '@/backend/indicateurs/shared/models/indicateur-service-tag.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { PermissionOperationEnum } from '../../../users/authorizations/permission-operation.enum';
import { ResourceType } from '../../../users/authorizations/resource-type.enum';

@Injectable()
export class HandleDefinitionServicesService {
  private readonly logger = new Logger(HandleDefinitionServicesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly updateIndicateurService: UpdateIndicateurDefinitionsService,
    private readonly permissionService: PermissionService
  ) {}

  async listIndicateurServices({
    indicateurId,
    collectiviteId,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    user: AuthUser;
  }): Promise<IndicateurDefinitionServiceTag[]> {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des services pilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    const indicateurServicesPilotes = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurServiceTagTable),
        nom: sql<string>`
                  CASE
                      WHEN ${serviceTagTable.nom} IS NOT NULL THEN ${serviceTagTable.nom}
                      ELSE ''
                  END
                `.as('nom'),
      })
      .from(indicateurServiceTagTable)
      .leftJoin(
        serviceTagTable,
        eq(serviceTagTable.id, indicateurServiceTagTable.serviceTagId)
      )
      .where(
        and(
          eq(indicateurServiceTagTable.indicateurId, indicateurId),
          eq(indicateurServiceTagTable.collectiviteId, collectiviteId)
        )
      )
      .groupBy(
        indicateurServiceTagTable.indicateurId,
        indicateurServiceTagTable.collectiviteId,
        indicateurServiceTagTable.serviceTagId,
        serviceTagTable.nom
      );
    return indicateurServicesPilotes;
  }

  async upsertIndicateurServices({
    indicateurId,
    collectiviteId,
    indicateurServicesPilotesIds,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    indicateurServicesPilotesIds: number[];
    user: AuthUser;
  }) {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Mise à jour des servicespilotes de l'indicateur dont l'id est ${indicateurId}`
    );

    await this.databaseService.db
      .delete(indicateurServiceTagTable)
      .where(
        and(
          eq(indicateurServiceTagTable.indicateurId, indicateurId),
          eq(indicateurServiceTagTable.collectiviteId, collectiviteId)
        )
      );

    if (indicateurServicesPilotesIds.length > 0) {
      await this.databaseService.db.insert(indicateurServiceTagTable).values(
        indicateurServicesPilotesIds.map((serviceTagId) => ({
          serviceTagId,
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
