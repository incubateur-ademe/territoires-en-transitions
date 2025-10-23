import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { UpdateIndicateurDefinitionInput } from '@/backend/indicateurs/definitions/mutate-definition/mutate-definition.input';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { SQL_CURRENT_TIMESTAMP } from '@/backend/utils/column.utils';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, isNotNull } from 'drizzle-orm';
import { HandleDefinitionFichesService } from '../handle-definition-fiches/handle-definition-fiches.service';
import { HandleDefinitionPilotesService } from '../handle-definition-pilotes/handle-definition-pilotes.service';
import { HandleDefinitionServicesService } from '../handle-definition-services/handle-definition-services.service';
import { HandleDefinitionThematiquesService } from '../handle-definition-thematiques/handle-definition-thematiques.service';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';

@Injectable()
export class UpdateDefinitionService {
  private readonly logger = new Logger(UpdateDefinitionService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly handleDefinitionFichesService: HandleDefinitionFichesService,
    private readonly handleDefinitionPilotesService: HandleDefinitionPilotesService,
    private readonly handleDefinitionServicesService: HandleDefinitionServicesService,
    private readonly handleDefinitionThematiquesService: HandleDefinitionThematiquesService
  ) {}

  async updateDefinition(
    {
      indicateurId,
      collectiviteId,
      indicateurFields,
    }: UpdateIndicateurDefinitionInput,
    user: AuthUser
  ): Promise<void> {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

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
          user,
        });
      }

      if (pilotes !== undefined) {
        await this.handleDefinitionPilotesService.upsertIndicateurPilotes({
          indicateurId,
          collectiviteId,
          pilotes,
          user,
        });
      }

      if (services !== undefined) {
        await this.handleDefinitionServicesService.upsertIndicateurServices({
          indicateurId,
          collectiviteId,
          serviceIds: services.map((s) => s.id),
          user,
        });
      }

      if (thematiques !== undefined) {
        await this.handleDefinitionThematiquesService.upsertIndicateurThematiques(
          {
            indicateurId,
            collectiviteId,
            thematiqueIds: thematiques.map((t) => t.id),
            user,
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
