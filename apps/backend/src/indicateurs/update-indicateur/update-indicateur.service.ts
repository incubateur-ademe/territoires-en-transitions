import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { UpdateIndicateurRequest } from '@/backend/indicateurs/update-indicateur/update-indicateur.request';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser, PermissionOperationEnum, ResourceType } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class UpdateIndicateurService {
  private readonly logger = new Logger(UpdateIndicateurService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) { }

  async updateIndicateur({
    indicateurId,
    indicateurFields,
    tokenInfo
  }: {
    indicateurId: number;
    indicateurFields: UpdateIndicateurRequest;
    tokenInfo: AuthUser;
  }) {



    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      indicateurFields.collectiviteId
    );

    this.logger.log(`Mise à jour de l'indicateur dont l'id est ${indicateurId}`);


    await this.databaseService.db
      .update(indicateurDefinitionTable)
      .set({
        ...indicateurFields,
        modifiedBy: tokenInfo.id,
        modifiedAt: new Date().toISOString(),
      })
      .where(eq(indicateurDefinitionTable.id, indicateurId));


    const updatedIndicateur = await this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .then((rows) => rows[0]);

    return updatedIndicateur;
  }
}
