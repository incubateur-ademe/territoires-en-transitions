import { RouterInput } from '@tet/api';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { eq } from 'drizzle-orm';
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
   * Supprime tous les indicateurs d'une collectivité
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
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
