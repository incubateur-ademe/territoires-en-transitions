import { BulkEditRequest } from '@tet/backend/plans/fiches/bulk-edit/bulk-edit.input';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { FicheCreate } from '@tet/domain/plans';
import { eq } from 'drizzle-orm';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';

class FichesFactory extends FixtureFactory {
  constructor() {
    super();
  }

  /**
   * Crée des fiches et stocke leurs IDs pour le cleanup
   */
  async create(user: UserFixture, fiches: FicheCreate[]): Promise<number[]> {
    const trpcClient = user.getTrpcClient();
    const createdFichesPromises = fiches.map((fiche) => {
      console.log('Create fiche', fiche);
      return trpcClient.plans.fiches.create.mutate({ fiche });
    });
    const createdFiches = await Promise.all(createdFichesPromises);
    const createdFicheIds = createdFiches.map((fiche) => fiche.id);
    return createdFicheIds;
  }

  /**
   * Édition groupée de fiches
   */
  async bulkEdit(user: UserFixture, request: BulkEditRequest): Promise<void> {
    return user.getTrpcClient().plans.fiches.bulkEdit.mutate(request);
  }

  /**
   * Supprime toutes les fiches d'une collectivité
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    const ret = await databaseService.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, collectiviteId))
      .returning();
    console.log(
      `${ret.length} fiches removed from collectivite ${collectiviteId}`
    );
  }
}

export const testWithFiches = testWithCollectivites.extend<{
  fiches: FichesFactory;
}>({
  fiches: async ({ collectivites }, use) => {
    const fiches = new FichesFactory();
    collectivites.registerCleanupFunc(fiches.cleanupByCollectiviteId);
    await use(fiches);
  },
});
