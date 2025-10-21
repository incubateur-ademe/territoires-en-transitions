import { indicateurThematiqueTable } from '@/backend/indicateurs/shared/models/indicateur-thematique.table';
import {
  Thematique,
  thematiqueTable,
} from '@/backend/shared/thematiques/thematique.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, asc, eq, notInArray } from 'drizzle-orm';
import { PermissionOperationEnum } from '../../../users/authorizations/permission-operation.enum';
import { ResourceType } from '../../../users/authorizations/resource-type.enum';

@Injectable()
export class HandleDefinitionThematiquesService {
  private readonly logger = new Logger(HandleDefinitionThematiquesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async listIndicateurThematiques({
    indicateurId,
    collectiviteId,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    user: AuthUser;
  }): Promise<Thematique[]> {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des thematiques de l'indicateur dont l'id est ${indicateurId}`
    );

    const indicateurThematiques = await this.databaseService.db
      .select({ id: thematiqueTable.id, nom: thematiqueTable.nom })
      .from(thematiqueTable)
      .leftJoin(
        indicateurThematiqueTable,
        eq(thematiqueTable.id, indicateurThematiqueTable.thematiqueId)
      )
      .where(eq(indicateurThematiqueTable.indicateurId, indicateurId))
      .orderBy(asc(thematiqueTable.nom));

    return indicateurThematiques;
  }

  async upsertIndicateurThematiques({
    indicateurId,
    collectiviteId,
    thematiqueIds,
    user,
  }: {
    indicateurId: number;
    collectiviteId: number;
    thematiqueIds: number[];
    user: AuthUser;
  }) {
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Mise à jour des thematiques de l'indicateur dont l'id est ${indicateurId}`
    );

    await this.databaseService.db.transaction(async (tx) => {
      // Delete all thematiques not in the new list
      const indicateurIdCondition = eq(
        indicateurThematiqueTable.indicateurId,
        indicateurId
      );

      const deleteConditions =
        thematiqueIds.length > 0
          ? and(
              indicateurIdCondition,
              notInArray(indicateurThematiqueTable.thematiqueId, thematiqueIds)
            )
          : indicateurIdCondition;

      await tx.delete(indicateurThematiqueTable).where(deleteConditions);

      // Insert all thematiques (PostgreSQL will ignore duplicates)
      if (thematiqueIds.length > 0) {
        await tx
          .insert(indicateurThematiqueTable)
          .values(
            thematiqueIds.map((thematiqueId) => ({
              thematiqueId,
              indicateurId,
            }))
          )
          .onConflictDoNothing();
      }
    });
  }
}
