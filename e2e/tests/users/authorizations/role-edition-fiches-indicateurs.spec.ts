import { BulkEditRequest } from '@/domain/plans';
import { expect } from '@playwright/test';
import { testWithUsers as test } from '../users.fixture';

test.describe('Role edition fiches indicateurs', () => {
  test.beforeEach(async ({ page, users }) => {
    const { user: adminUser, collectivite } =
      await users.addCollectiviteAndUserWithLogin(page.context(), {
        user: {
          accessLevel: 'admin',
        },
      });

    console.log(`Create fiches with admin user`);
    const createdFicheIds = await adminUser.createFiches([
      {
        titre: 'Fiche test',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
      {
        titre: 'Deuxième fiche',
        collectiviteId: collectivite.data.id,
        statut: 'À venir',
      },
    ]);

    const limitedEditionUser = await users.addUser({
      accessLevel: 'edition_fiches_indicateurs',
      cguAcceptees: true,
      collectiviteId: collectivite.data.id,
    });

    console.log(
      `Add pilotes ${
        limitedEditionUser.data.userId
      } to fiches with ids ${createdFicheIds.join(',')} for collectivite ${
        collectivite.data.id
      }`
    );
    const bulkEditRequest: BulkEditRequest = {
      collectiviteId: collectivite.data.id,
      ficheIds: createdFicheIds,
      pilotes: {
        add: [{ userId: limitedEditionUser.data.userId }],
      },
    };
    await adminUser.bulkEditFiches(bulkEditRequest);

    limitedEditionUser.setExtraCleanupBeforeUserCleanup(async () => {
      // Remove the pilote from the fiches to be able to delete the user
      await adminUser.bulkEditFiches({
        collectiviteId: collectivite.data.id,
        ficheIds: createdFicheIds,
        pilotes: {
          remove: [{ userId: limitedEditionUser.data.userId }],
        },
      });
    });

    // Now that the fiches are created, we can login as limited edition user
    await limitedEditionUser.loginAndSetupTrpcClient(page.context());

    page.goto('/');

    console.log('createdFicheIds', createdFicheIds);
  });

  test('Home page', async ({ page }) => {
    // We are on the personal tableaud de bord page
    await expect(page.getByText(/2\s*Actions pilotées/)).toBeVisible();
    await expect(
      page.getByText('Actions dont je suis le pilote')
    ).toBeVisible();
    await expect(page.getByText(/0\s*Indicateur piloté/)).toBeVisible();
    await expect(
      page.getByText('Indicateurs dont je suis le pilote')
    ).toBeVisible();
  });
});
