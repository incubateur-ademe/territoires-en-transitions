import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { DeleteIndicateurDefinitionInput } from '@/backend/indicateurs/definitions/mutate-definition/mutate-definition.input';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, isNotNull } from 'drizzle-orm';

@Injectable()
export class DeleteDefinitionService {
  private readonly logger = new Logger(DeleteDefinitionService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Supprime un indicateur pour une collectivité
   */
  async deleteIndicateurPerso(
    { indicateurId, collectiviteId }: DeleteIndicateurDefinitionInput,
    user: AuthUser
  ): Promise<void> {
    // Vérification des permissions
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Suppression de l'indicateur dont l'id est ${indicateurId} pour la collectivité ${collectiviteId}`
    );

    // Suppression de l'indicateur avec vérification que c'est bien un indicateur perso
    // (collectiviteId doit correspondre et ne pas être null)
    const [deleted] = await this.databaseService.db
      .delete(indicateurDefinitionTable)
      .where(
        and(
          eq(indicateurDefinitionTable.id, indicateurId),
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId),

          // Petite sécurité supplémentaire pour éviter de supprimer un indicateur non perso
          isNotNull(indicateurDefinitionTable.collectiviteId)
        )
      )
      .returning();

    if (!deleted) {
      throw new NotFoundException(
        `Indicateur ${indicateurId} non trouvé pour la collectivité ${collectiviteId}`
      );
    }

    this.logger.log(
      `Indicateur ${indicateurId} supprimé avec succès pour la collectivité ${collectiviteId}`
    );
  }
}
