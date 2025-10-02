import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, notInArray } from 'drizzle-orm';

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
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Mise à jour des fiches liées de l'indicateur dont l'id est ${indicateurId}`
    );

    await this.databaseService.db.transaction(async (tx) => {
      const indicateurIdCondition = eq(
        ficheActionIndicateurTable.indicateurId,
        indicateurId
      );

      const deleteConditions =
        ficheIds.length > 0
          ? and(
              indicateurIdCondition,
              notInArray(ficheActionIndicateurTable.ficheId, ficheIds)
            )
          : indicateurIdCondition;

      await tx.delete(ficheActionIndicateurTable).where(deleteConditions);

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
