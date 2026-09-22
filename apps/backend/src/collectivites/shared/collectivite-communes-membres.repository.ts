import { Injectable } from '@nestjs/common';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq, max } from 'drizzle-orm';

/**
 * Lecture de la composition communale d'un groupement, telle que la fiche
 * collectivité la montre : `collectivite_relations` rattache chaque commune
 * membre à son EPCI, et la population se lit sur la ligne `collectivite` de la
 * commune.
 *
 * Cette table ne retient que les communes présentes dans `collectivite`, donc
 * celles de 3 000 habitants et plus. Les seuils légaux qui s'appuient sur « au
 * moins une commune de plus de N habitants » sont tous bien au-dessus : la
 * source suffit, et elle épargne un rapprochement par SIREN avec les tables
 * d'import BANATIC.
 */
@Injectable()
export class CollectiviteCommunesMembresRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Population de la plus peuplée des communes membres, `null` pour une
   * collectivité sans commune membre connue (une commune, un groupement dont
   * la composition n'est pas importée).
   */
  async getPopulationMaxCommuneMembre(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<number | null> {
    const [row] = await (tx ?? this.databaseService.db)
      .select({ population: max(collectiviteTable.population) })
      .from(collectiviteRelationsTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, collectiviteRelationsTable.id)
      )
      .where(eq(collectiviteRelationsTable.parentId, collectiviteId));

    return row?.population ?? null;
  }
}
