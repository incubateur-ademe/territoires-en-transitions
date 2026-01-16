import { Injectable, Logger } from '@nestjs/common';
import { indicateurThematiqueTable } from '@tet/backend/indicateurs/shared/models/indicateur-thematique.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Thematique } from '@tet/domain/shared';
import { and, asc, eq, notInArray } from 'drizzle-orm';
import { ResourceType } from '@tet/domain/users';

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
      'indicateurs.indicateurs.read',
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
    thematiqueIds,
  }: {
    indicateurId: number;
    thematiqueIds: number[];
  }) {
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
