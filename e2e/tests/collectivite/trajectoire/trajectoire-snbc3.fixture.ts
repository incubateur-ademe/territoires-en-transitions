import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';

/**
 * Écrit des valeurs `snbc3` comme l'import du lot 1 (objectifs annuels sur
 * l'unique métadonnée `snbc3`). Pas de réutilisation de
 * `trajectoire-snbc3.test-fixture.ts` du backend : il importe `vitest`, qui ne
 * se charge pas sous Playwright.
 */
class TrajectoiresSnbc3Factory extends FixtureFactory {
  private metadonneeId: number | null = null;

  async addValeurs(
    collectiviteId: number,
    valeurs: { identifiant: string; annee: number; objectif: number }[]
  ): Promise<void> {
    const metadonneeId = await this.getOrCreateMetadonneeId();
    const identifiants = [...new Set(valeurs.map((v) => v.identifiant))];
    const definitions = await databaseService.db
      .select({
        id: indicateurDefinitionTable.id,
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
      })
      .from(indicateurDefinitionTable)
      .where(
        inArray(indicateurDefinitionTable.identifiantReferentiel, identifiants)
      );
    const idByIdentifiant = new Map(
      definitions.map((d) => [d.identifiant, d.id])
    );

    await databaseService.db.insert(indicateurValeurTable).values(
      valeurs.map(({ identifiant, annee, objectif }) => {
        const indicateurId = idByIdentifiant.get(identifiant);
        if (!indicateurId) {
          throw new Error(`Indicateur ${identifiant} introuvable`);
        }
        return {
          collectiviteId,
          indicateurId,
          dateValeur: `${annee}-01-01`,
          metadonneeId,
          objectif,
        };
      })
    );
  }

  /** Rattache une commune à son EPCI (`collectivite_relations`). */
  async addEpciParent(communeId: number, epciId: number): Promise<void> {
    await databaseService.db
      .insert(collectiviteRelationsTable)
      .values({ id: communeId, parentId: epciId });
  }

  /** Les relations cascadent avec la collectivité ; restent les valeurs. */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    if (this.metadonneeId === null) {
      return;
    }
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.metadonneeId, this.metadonneeId)
        )
      );
  }

  private async getOrCreateMetadonneeId(): Promise<number> {
    if (this.metadonneeId !== null) {
      return this.metadonneeId;
    }
    await databaseService.db
      .insert(indicateurSourceTable)
      .values({ id: IndicateurSourceEnum.SNBC3, libelle: 'SNBC3' })
      .onConflictDoNothing();
    const [existing] = await databaseService.db
      .select({ id: indicateurSourceMetadonneeTable.id })
      .from(indicateurSourceMetadonneeTable)
      .where(
        eq(indicateurSourceMetadonneeTable.sourceId, IndicateurSourceEnum.SNBC3)
      )
      .orderBy(asc(indicateurSourceMetadonneeTable.id))
      .limit(1);
    if (existing) {
      this.metadonneeId = existing.id;
      return existing.id;
    }
    const [created] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId: IndicateurSourceEnum.SNBC3,
        dateVersion: '2026-11-02T00:00:00',
        nomDonnees: 'SNBC3',
        diffuseur: 'ADEME',
        producteur: 'ADEME',
      })
      .returning({ id: indicateurSourceMetadonneeTable.id });
    this.metadonneeId = created.id;
    return created.id;
  }
}

export const testWithTrajectoiresSnbc3 = testWithCollectivites.extend<{
  trajectoiresSnbc3: TrajectoiresSnbc3Factory;
}>({
  trajectoiresSnbc3: async ({ collectivites }, use) => {
    const factory = new TrajectoiresSnbc3Factory();
    collectivites.registerCleanupFunc(factory);
    await use(factory);
  },
});
