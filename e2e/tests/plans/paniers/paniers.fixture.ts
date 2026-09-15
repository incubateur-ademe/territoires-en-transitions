import { Page } from '@playwright/test';
import { panierTable } from '@tet/backend/plans/paniers/models/panier.table';
import assert from 'assert';
import { eq, or, sql } from 'drizzle-orm';
import { testWithReferentiels } from 'tests/referentiels/referentiels.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';

export const toPanierUrl = (path: string): string => {
  assert(process.env.PANIER_URL, 'PANIER_URL is not set');
  return new URL(path, process.env.PANIER_URL).toString();
};

const AXEPTIO_SDK_URL_PATTERN = 'https://static.axept.io/**';

const USERS_GET_URL_PATTERN = '**/trpc/users.users.get**';

export const failUserCollectivitesRequest = async (
  page: Page
): Promise<void> => {
  await page.route(USERS_GET_URL_PATTERN, (route) =>
    route.fulfill({ status: 500 })
  );
};

export const toUniqueNom = (label: string): string =>
  `${label} ${crypto.randomUUID().slice(0, 8)}`;

class PaniersFactory extends FixtureFactory {
  async createWithAction(collectiviteId: number): Promise<string> {
    const { rows } = await databaseService.db.execute<{ id: string }>(
      sql`select id from panier_from_landing(${collectiviteId})`
    );
    const [panier] = rows;
    assert(panier, `No panier created for collectivite ${collectiviteId}`);
    await databaseService.db.execute(
      sql`insert into action_impact_panier (panier_id, action_id) select ${panier.id}::uuid, id from action_impact order by id limit 1`
    );
    return panier.id;
  }

  async refreshSiteLabellisation(): Promise<void> {
    await databaseService.db.execute(
      sql`refresh materialized view stats.collectivite`
    );
    await databaseService.db.execute(
      sql`refresh materialized view site_labellisation`
    );
  }

  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    const isPanierOfCollectivite = or(
      eq(panierTable.collectiviteId, collectiviteId),
      eq(panierTable.collectivitePreset, collectiviteId)
    );
    const paniersOfCollectivite = databaseService.db
      .select({ id: panierTable.id })
      .from(panierTable)
      .where(isPanierOfCollectivite);

    await databaseService.db.execute(
      sql`delete from action_impact_statut where panier_id in (${paniersOfCollectivite})`
    );
    await databaseService.db.execute(
      sql`delete from action_impact_panier where panier_id in (${paniersOfCollectivite})`
    );
    await databaseService.db.delete(panierTable).where(isPanierOfCollectivite);
  }
}

export const testWithPaniers = testWithReferentiels.extend<{
  paniers: PaniersFactory;
}>({
  paniers: async ({ collectivites, page }, use): Promise<void> => {
    await page.route(AXEPTIO_SDK_URL_PATTERN, (route) => route.abort());
    const paniers = new PaniersFactory();
    collectivites.registerCleanupFunc(paniers);
    await use(paniers);
  },
});
