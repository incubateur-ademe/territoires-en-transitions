import { RouterInput } from '@tet/api';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { eq } from 'drizzle-orm';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';

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
    console.log('Create indicateur', indicateurId);
    return indicateurId;
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
    console.log('Delete indicateur', indicateurId);
  }

  /**
   * Supprime tous les indicateurs d'une collectivité
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    const ret = await databaseService.db
      .delete(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.collectiviteId, collectiviteId))
      .returning();
    console.log(
      `${ret.length} indicateur(s) removed from collectivite ${collectiviteId}`
    );
  }
}

export const testWithIndicateurs = testWithCollectivites.extend<{
  indicateurs: IndicateursFactory;
}>({
  indicateurs: async ({ collectivites }, use) => {
    const indicateurs = new IndicateursFactory();
    collectivites.registerCleanupFunc(indicateurs);
    await use(indicateurs);
  },
});
