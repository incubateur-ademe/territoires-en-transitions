import { expect } from '@playwright/test';
import { testWithUsers as test } from '../../../users/users.fixture';

test.describe('Liste des fiches', () => {
  test.beforeEach(async ({ page, users }) => {
    const { user, collectivite } = await users.addCollectiviteAndUserWithLogin(
      page.context()
    );

    console.log(`Create fiches`);
    const createdFicheIds = await user.createFiches([
      {
        titre: 'Fiche test',
        collectiviteId: collectivite.data.id,
      },
      {
        titre: 'Deuxième fiche',
        collectiviteId: collectivite.data.id,
      },
    ]);
    page.goto('/');

    console.log('createdFicheIds', createdFicheIds);

    await page.locator('[data-test="nav-pa"]').click();
    await page.locator('[data-test="pa-fa-toutes"]').click();
    await page.getByRole('heading', { name: 'Toutes les fiches' }).click();
  });

  test('Recherche texte', async ({ page, users }) => {
    await expect(page.locator('[data-test="FicheActionCarte"]')).toHaveCount(2);
    await page
      .getByRole('searchbox', { name: 'Rechercher par nom ou' })
      .fill('toto');
    await expect(
      page.getByRole('heading', { name: 'Aucune fiche action ne' })
    ).toBeVisible();

    await page
      .getByRole('searchbox', { name: 'Rechercher par nom ou' })
      .fill('test');
    await expect(page.locator('[data-test="FicheActionCarte"]')).toHaveCount(1);
  });
});
