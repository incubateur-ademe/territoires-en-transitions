import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getIndicateurIdByIdentifiant } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq, inArray } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';

/** Données de lecture des leviers, sans recalcul de trajectoire via Google Drive. */
export async function addTestTrajectoireLeviers(database: DatabaseService) {
  const siren = String(randomInt(900000000, 1000000000));
  const fixture = await addTestCollectivite(database, {
    type: 'epci',
    regionCode: '44',
    siren,
  });
  await database.db
    .insert(indicateurSourceTable)
    .values([{ id: 'snbc', libelle: 'SNBC' }])
    .onConflictDoNothing();
  const metadata = await database.db
    .insert(indicateurSourceMetadonneeTable)
    .values([
      { sourceId: 'snbc', dateVersion: '2026-01-01' },
      { sourceId: 'rare', dateVersion: '2026-01-01' },
    ])
    .returning();
  const indicateurId = await getIndicateurIdByIdentifiant(database, 'cae_1.c');
  const value = {
    collectiviteId: fixture.collectivite.id,
    indicateurId,
    periodicite: 'annuelle' as const,
  };
  await database.db.insert(indicateurValeurTable).values([
    {
      ...value,
      dateValeur: '2019-01-01',
      metadonneeId: metadata[1].id,
      resultat: 100,
    },
    ...[
      { dateValeur: '2019-01-01', objectif: 100 },
      { dateValeur: '2030-01-01', objectif: 60 },
    ].map((objectif) => ({
      ...value,
      ...objectif,
      metadonneeId: metadata[0].id,
      objectifCommentaire: "Source des données d'entrée: rare",
    })),
  ]);

  return {
    collectivite: { ...fixture.collectivite, siren },
    cleanup: async () => {
      await database.db
        .delete(indicateurValeurTable)
        .where(
          eq(indicateurValeurTable.collectiviteId, fixture.collectivite.id)
        );
      await database.db.delete(indicateurSourceMetadonneeTable).where(
        inArray(
          indicateurSourceMetadonneeTable.id,
          metadata.map(({ id }) => id)
        )
      );
      await fixture.cleanup();
    },
  };
}
