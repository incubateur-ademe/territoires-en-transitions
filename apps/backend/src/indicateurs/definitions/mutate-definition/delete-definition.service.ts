import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DeleteIndicateurDefinitionInput } from '@tet/backend/indicateurs/definitions/mutate-definition/mutate-definition.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ResourceType } from '@tet/domain/users';
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
      'indicateurs.indicateurs.delete',
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
