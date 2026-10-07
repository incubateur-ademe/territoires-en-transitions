import { RouterInput } from '@tet/api';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { desc, eq } from 'drizzle-orm';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';
import { IndicateurDetailPom } from './indicateur-detail/indicateur-detail.pom';

class IndicateursFactory extends FixtureFactory {
  constructor() {
    super();
  }

  /**
   * Crée un indicateur personnalisé
   */
  async create(
    user: UserFixture,
    indicateur: RouterInput['indicateurs']['indicateurs']['create']
  ): Promise<number> {
    const trpcClient = user.getTrpcClient();
    const indicateurId = await trpcClient.indicateurs.indicateurs.create.mutate(
      indicateur
    );

    return indicateurId;
  }

  /**
   * Met à jour un indicateur
   */
  async update(
    user: UserFixture,
    indicateur: RouterInput['indicateurs']['indicateurs']['update']
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await trpcClient.indicateurs.indicateurs.update.mutate(indicateur);
  }

  /**
   * Supprime un indicateur
   */
  async delete(
    user: UserFixture,
    indicateurId: number,
    collectiviteId: number
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await trpcClient.indicateurs.indicateurs.delete.mutate({
      indicateurId,
      collectiviteId,
    });
  }

  /**
   * Ajoute des résultats à un indicateur prédéfini (ex : `cae_18`).
   *
   * Les valeurs de la collectivité sont saisies via l'API, comme depuis l'UI.
   * Les valeurs open data (`sourceId`) sont insérées directement en base car
   * aucune route ne permet de les créer.
   */
  async addResultats(
    user: UserFixture,
    {
      collectiviteId,
      identifiantReferentiel,
      valeurs,
    }: {
      collectiviteId: number;
      identifiantReferentiel: string;
      valeurs: { dateValeur: string; resultat: number; sourceId?: string }[];
    }
  ): Promise<void> {
    const [indicateur] = await databaseService.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(
        eq(
          indicateurDefinitionTable.identifiantReferentiel,
          identifiantReferentiel
        )
      );
    if (!indicateur) {
      throw new Error(`Indicateur ${identifiantReferentiel} introuvable`);
    }

    const trpcClient = user.getTrpcClient();
    for (const { dateValeur, resultat, sourceId } of valeurs) {
      if (sourceId) {
        await databaseService.db.insert(indicateurValeurTable).values({
          indicateurId: indicateur.id,
          collectiviteId,
          dateValeur,
          resultat,
          metadonneeId: await this.getLastMetadonneeId(sourceId),
        });
      } else {
        await trpcClient.indicateurs.valeurs.upsert.mutate({
          indicateurId: indicateur.id,
          collectiviteId,
          dateValeur,
          resultat,
        });
      }
    }
  }

  async getLastMetadonneeId(sourceId: string): Promise<number> {
    const [metadonnee] = await databaseService.db
      .select({ id: indicateurSourceMetadonneeTable.id })
      .from(indicateurSourceMetadonneeTable)
      .where(eq(indicateurSourceMetadonneeTable.sourceId, sourceId))
      .orderBy(desc(indicateurSourceMetadonneeTable.dateVersion))
      .limit(1);
    if (!metadonnee) {
      throw new Error(`Métadonnée de la source ${sourceId} introuvable`);
    }
    return metadonnee.id;
  }

  /**
   * Supprime tous les indicateurs d'une collectivité, ainsi que les valeurs et
   * les préférences de suivi (non suivi, etc.) saisies sur les indicateurs
   * prédéfinis : à supprimer avant les users (FK created_by / modified_by)
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(eq(indicateurValeurTable.collectiviteId, collectiviteId));
    await databaseService.db
      .delete(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.collectiviteId, collectiviteId));
    await databaseService.db
      .delete(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.collectiviteId, collectiviteId));
  }
}

export const testWithIndicateurs = testWithCollectivites.extend<{
  indicateurs: IndicateursFactory;
  indicateurDetailPom: IndicateurDetailPom;
}>({
  indicateurs: async ({ collectivites }, use) => {
    const indicateurs = new IndicateursFactory();
    collectivites.registerCleanupFunc(indicateurs);
    await use(indicateurs);
  },
  indicateurDetailPom: async ({ page }, use) => {
    await use(new IndicateurDetailPom(page));
  },
});
