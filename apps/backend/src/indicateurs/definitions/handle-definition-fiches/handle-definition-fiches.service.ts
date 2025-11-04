import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

@Injectable()
export class HandleDefinitionFichesService {
  private readonly logger = new Logger(HandleDefinitionFichesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async upsertIndicateurFiches({
    indicateurId,
    collectiviteId,
    ficheIds,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    ficheIds: number[];
    user: AuthUser;
  }) {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.UPDATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Mise à jour des fiches liées de l'indicateur dont l'id est ${indicateurId}`
    );

    await this.databaseService.db.transaction(async (tx) => {
      const deleteConditions = [
        eq(ficheActionIndicateurTable.indicateurId, indicateurId),
        inArray(
          ficheActionIndicateurTable.ficheId,
          // subquery to filter by collectiviteId
          tx
            .select({ id: ficheActionTable.id })
            .from(ficheActionTable)
            .where(eq(ficheActionTable.collectiviteId, collectiviteId))
        ),
      ];

      // Do not delete fiches that may still exist in the new list
      if (ficheIds.length > 0) {
        deleteConditions.push(
          notInArray(ficheActionIndicateurTable.ficheId, ficheIds)
        );
      }

      await tx
        .delete(ficheActionIndicateurTable)
        .where(and(...deleteConditions));

      // Insert new fiches
      if (ficheIds.length > 0) {
        await tx
          .insert(ficheActionIndicateurTable)
          .values(
            ficheIds.map((ficheId) => ({
              ficheId,
              indicateurId,
            }))
          )
          .onConflictDoNothing();
      }
    });
  }
}
