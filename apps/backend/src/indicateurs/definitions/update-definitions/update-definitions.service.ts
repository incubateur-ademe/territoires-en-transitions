import { UpdateIndicateurDefinitionRequest } from '@/backend/indicateurs/definitions/update-definitions/update-definitions.request';
import { indicateurDefinitionTable } from '@/backend/indicateurs/shared/models/indicateur-definition.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class UpdateIndicateurDefinitionsService {
  private readonly logger = new Logger(UpdateIndicateurDefinitionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async updateIndicateur({
    indicateurId,
    indicateurFields,
    user,
  }: {
    indicateurId: number;
    indicateurFields: UpdateIndicateurDefinitionRequest;
    user: AuthUser;
  }) {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      indicateurFields.collectiviteId
    );

    this.logger.log(
      `Mise à jour de l'indicateur dont l'id est ${indicateurId}`
    );

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
