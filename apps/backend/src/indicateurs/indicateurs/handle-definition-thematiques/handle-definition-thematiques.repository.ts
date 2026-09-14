import { Injectable } from '@nestjs/common';
import { indicateurThematiqueTable } from '@tet/backend/indicateurs/shared/models/indicateur-thematique.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Thematique } from '@tet/domain/shared';
import { and, asc, eq, notInArray } from 'drizzle-orm';

type UpsertIndicateurThematiques = Readonly<{
  indicateurId: number;
  thematiqueIds: number[];
}>;

@Injectable()
export class HandleDefinitionThematiquesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  listIndicateurThematiques(indicateurId: number): Promise<Thematique[]> {
    return this.databaseService.db
      .select({ id: thematiqueTable.id, nom: thematiqueTable.nom })
      .from(thematiqueTable)
      .leftJoin(
        indicateurThematiqueTable,
        eq(thematiqueTable.id, indicateurThematiqueTable.thematiqueId)
      )
      .where(eq(indicateurThematiqueTable.indicateurId, indicateurId))
      .orderBy(asc(thematiqueTable.nom));
  }

  async upsertIndicateurThematiques(
    { indicateurId, thematiqueIds }: UpsertIndicateurThematiques,
    tx?: Transaction
  ): Promise<void> {
    const writeDb = tx ?? this.databaseService.db;
    const scope = eq(indicateurThematiqueTable.indicateurId, indicateurId);
    await writeDb
      .delete(indicateurThematiqueTable)
      .where(
        thematiqueIds.length > 0
          ? and(
              scope,
              notInArray(indicateurThematiqueTable.thematiqueId, thematiqueIds)
            )
          : scope
      );

    if (thematiqueIds.length > 0) {
      await writeDb
        .insert(indicateurThematiqueTable)
        .values(
          thematiqueIds.map((thematiqueId) => ({
            thematiqueId,
            indicateurId,
          }))
        )
        .onConflictDoNothing();
    }
  }
}
