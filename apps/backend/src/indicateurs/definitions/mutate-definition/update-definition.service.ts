import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { UpdateIndicateurDefinitionInput } from '@tet/backend/indicateurs/definitions/mutate-definition/mutate-definition.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { hasPermission, ResourceType } from '@tet/domain/users';
import { and, eq, isNotNull } from 'drizzle-orm';
import { GetUserRolesAndPermissionsService } from '../../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { HandleDefinitionFichesService } from '../../indicateurs/handle-definition-fiches/handle-definition-fiches.service';
import { HandleDefinitionPilotesService } from '../../indicateurs/handle-definition-pilotes/handle-definition-pilotes.service';
import { HandleDefinitionServicesService } from '../../indicateurs/handle-definition-services/handle-definition-services.service';
import { HandleDefinitionThematiquesService } from '../../indicateurs/handle-definition-thematiques/handle-definition-thematiques.service';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';

@Injectable()
export class UpdateDefinitionService {
  private readonly logger = new Logger(UpdateDefinitionService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly permissionService: PermissionService,
    private readonly handleDefinitionFichesService: HandleDefinitionFichesService,
    private readonly handleDefinitionPilotesService: HandleDefinitionPilotesService,
    private readonly handleDefinitionServicesService: HandleDefinitionServicesService,
    private readonly handleDefinitionThematiquesService: HandleDefinitionThematiquesService
  ) {}

  private async canUpdateDefinition(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateurId: number,
    doNotThrow?: boolean
  ): Promise<boolean> {
    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
      });

    if (!userPermissionsResult.success) {
      if (!doNotThrow) {
        throw new ForbiddenException(
          `Droits insuffisants, l'utilisateur ${user.id} n'a pas les droits pour mettre à jour l'indicateur ${indicateurId} de la collectivité ${collectiviteId}`
        );
      }

      return false;
    }

    const userPermissions = userPermissionsResult.data;

    if (
      hasPermission(userPermissions, 'indicateurs.indicateurs.update', {
        collectiviteId,
      })
    ) {
      return true;
    }

    if (
      hasPermission(
        userPermissions,
        'indicateurs.indicateurs.update_piloted_by_me',
        { collectiviteId }
      )
    ) {
      const pilotes =
        await this.handleDefinitionPilotesService.listIndicateurPilotes({
          indicateurId,
          collectiviteId,
          user,
        });

      if (pilotes.some((p) => p.userId === user.id)) {
        return true;
      }
    }

    if (!doNotThrow) {
      this.permissionService.throwForbiddenException(
        user,
        'indicateurs.indicateurs.update',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }
    return false;
  }

  async updateDefinition(
    {
      indicateurId,
      collectiviteId,
      indicateurFields,
    }: UpdateIndicateurDefinitionInput,
    user: AuthenticatedUser
  ): Promise<void> {
    await this.canUpdateDefinition(user, collectiviteId, indicateurId);

    this.logger.log(
      `Mise à jour de l'indicateur dont l'id est ${indicateurId}`
    );

    const {
      commentaire,
      estConfidentiel,
      estFavori,
      titre,
      unite,
      ficheIds,
      pilotes,
      services,
      thematiques,
    } = indicateurFields;

    await this.databaseService.db.transaction(async (tx) => {
      if (
        commentaire !== undefined ||
        estConfidentiel !== undefined ||
        estFavori !== undefined
      ) {
        await tx
          .insert(indicateurCollectiviteTable)
          .values({
            indicateurId,
            collectiviteId,
            ...(commentaire !== undefined && {
              commentaire,
            }),
            ...(estConfidentiel !== undefined && {
              confidentiel: estConfidentiel,
            }),
            ...(estFavori !== undefined && {
              favoris: estFavori,
            }),
            modifiedBy: user.id,
            modifiedAt: SQL_CURRENT_TIMESTAMP,
          })
          .onConflictDoUpdate({
            target: [
              indicateurCollectiviteTable.indicateurId,
              indicateurCollectiviteTable.collectiviteId,
            ],
            set: {
              ...(commentaire !== undefined && {
                commentaire,
              }),
              ...(estConfidentiel !== undefined && {
                confidentiel: estConfidentiel,
              }),
              ...(estFavori !== undefined && {
                favoris: estFavori,
              }),
              modifiedBy: user.id,
              modifiedAt: SQL_CURRENT_TIMESTAMP,
            },
          });
      }

      if (titre !== undefined || unite !== undefined) {
        const updateResult = await tx
          .update(indicateurDefinitionTable)
          .set({
            ...(titre !== undefined && { titre }),
            ...(unite !== undefined && { unite }),
          })
          .where(
            and(
              eq(indicateurDefinitionTable.id, indicateurId),
              eq(indicateurDefinitionTable.collectiviteId, collectiviteId),

              // Petite sécurité supplémentaire pour éviter de modifier un indicateur non perso
              isNotNull(indicateurDefinitionTable.collectiviteId)
            )
          )
          .returning();

        if (updateResult.length === 0) {
          throw new NotFoundException(
            `Indicateur ${indicateurId} non trouvé pour la collectivité ${collectiviteId}`
          );
        }
      }

      if (ficheIds !== undefined) {
        await this.handleDefinitionFichesService.upsertIndicateurFiches({
          indicateurId,
          collectiviteId,
          ficheIds,
        });
      }

      if (pilotes !== undefined) {
        await this.handleDefinitionPilotesService.upsertIndicateurPilotes({
          indicateurId,
          collectiviteId,
          pilotes,
        });
      }

      if (services !== undefined) {
        await this.handleDefinitionServicesService.upsertIndicateurServices({
          indicateurId,
          collectiviteId,
          serviceIds: services.map((s) => s.id),
        });
      }

      if (thematiques !== undefined) {
        await this.handleDefinitionThematiquesService.upsertIndicateurThematiques(
          {
            indicateurId,
            thematiqueIds: thematiques.map((t) => t.id),
          }
        );
      }

      // Only update modified fields if we have changes that don't affect indicateurCollectiviteTable
      // (since we already handle modifiedBy/modifiedAt in the upsert above)
      const hasNonCollectiviteChanges =
        titre !== undefined ||
        unite !== undefined ||
        ficheIds !== undefined ||
        pilotes !== undefined ||
        services !== undefined ||
        thematiques !== undefined;

      if (hasNonCollectiviteChanges) {
        await this.updateDefinitionModifiedFields(
          {
            indicateurId,
            collectiviteId,
            user,
          },
          tx
        );
      }
    });
  }

  async updateDefinitionModifiedFields(
    {
      indicateurId,
      collectiviteId,
      user,
    }: {
      indicateurId: number;
      collectiviteId: number;
      user: AuthUser;
    },
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .update(indicateurCollectiviteTable)
      .set({ modifiedBy: user.id, modifiedAt: SQL_CURRENT_TIMESTAMP })
      .where(
        and(
          eq(indicateurCollectiviteTable.indicateurId, indicateurId),
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId)
        )
      );
  }
}
