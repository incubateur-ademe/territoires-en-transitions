import { BulkEditRequest } from '@tet/backend/plans/fiches/bulk-edit/bulk-edit.input';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { FicheCreate } from '@tet/domain/plans';
import { eq } from 'drizzle-orm';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';
import { FicheCardPom } from './list-fiches/fiche-card.pom';
import { FilterFichesPom } from './list-fiches/filter-fiches.pom';
import { ListFichesPom } from './list-fiches/list-fiches.pom';

class FichesFactory extends FixtureFactory {
  constructor() {
    super();
  }

  /**
   * Crée des fiches
   */
  async create(
    user: UserFixture,
    fiches: Array<FicheCreate & { axeId?: number; axeIds?: number[] }>
  ): Promise<number[]> {
    const trpcClient = user.getTrpcClient();
    const createdFichesPromises = fiches.map((fiche) => {
      const axesIds = fiche.axeIds ?? (fiche.axeId ? [fiche.axeId] : []);
      return trpcClient.plans.fiches.create.mutate({
        fiche,
        ficheFields: axesIds.length
          ? {
              axes: axesIds.map((id) => ({ id })),
            }
          : undefined,
      });
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
    await databaseService.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, collectiviteId));
  }
}

export const testWithFiches = testWithCollectivites.extend<{
  fiches: FichesFactory;
  filterFichesPom: FilterFichesPom;
  listFichesPom: ListFichesPom;
  ficheCardPom: FicheCardPom;
}>({
  fiches: async ({ collectivites }, use) => {
    const fiches = new FichesFactory();
    collectivites.registerCleanupFunc(fiches);
    await use(fiches);
  },
  filterFichesPom: async ({ page }, use) => {
    const filterFiches = new FilterFichesPom(page);
    await use(filterFiches);
  },
  listFichesPom: async ({ page }, use) => {
    const listFichesPom = new ListFichesPom(page);
    await use(listFichesPom);
  },
  ficheCardPom: async ({ page }, use) => {
    const ficheCardPom = new FicheCardPom({ page });
    await use(ficheCardPom);
  },
});
