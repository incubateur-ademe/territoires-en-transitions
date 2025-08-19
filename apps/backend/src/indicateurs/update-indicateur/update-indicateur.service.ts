import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { UpdateIndicateurRequest } from '@/backend/indicateurs/update-indicateur/update-indicateur.request';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthenticatedUser, PermissionOperationEnum, ResourceType } from '@/backend/users/index-domain';
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
    user
  }: {
    indicateurId: number;
    indicateurFields: UpdateIndicateurRequest;
    user: AuthenticatedUser;
  }) {



    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      indicateurFields.collectiviteId
    );

    this.logger.log(`Mise à jour de l'indicateur dont l'id est ${indicateurId} par ${user.id}`);


    await this.databaseService.db
      .update(indicateurDefinitionTable)
      .set({
        ...indicateurFields,
        modifiedBy: user.id,
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
