import { expect } from '@playwright/test';
import { testWithFiches } from 'tests/plans/fiches/fiches.fixture';

const test = testWithFiches;

test.describe('Role edition fiches indicateurs', () => {
  test.beforeEach(async ({ page, collectivites, fiches }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: {
          accessLevel: 'admin',
          autoLogin: true,
        },
      });

    console.log(`Create fiches with admin user`);
    const createdFicheIds = await fiches.create(adminUser, [
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

    const limitedEditionUser = await collectivite.addUser({
      accessLevel: 'edition_fiches_indicateurs',
      cguAcceptees: true,
    });

    console.log(
      `Add pilotes ${
        limitedEditionUser.data.userId
      } to fiches with ids ${createdFicheIds.join(',')} for collectivite ${
        collectivite.data.id
      }`
    );
    const bulkEditRequest = {
      collectiviteId: collectivite.data.id,
      ficheIds: createdFicheIds,
      pilotes: {
        add: [{ userId: limitedEditionUser.data.userId }],
      },
    };
    await fiches.bulkEdit(adminUser, bulkEditRequest);

    // Now that the fiches are created, we can login as limited edition user
    await limitedEditionUser.login();
    page.goto('/');

    console.log('createdFicheIds', createdFicheIds);
  });

  test('Home page', async ({ page }) => {
    // We are on the personal tableau de bord page
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
