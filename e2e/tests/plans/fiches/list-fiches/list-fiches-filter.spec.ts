import { expect } from '@playwright/test';
import { testWithUsers as test } from '../../../users/users.fixture';
import { FilterFichesPom } from './filter-fiches.pom';
import { ListFichesPom } from './list-fiches.pom';

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
        statut: 'En cours',
      },
      {
        titre: 'Deuxième fiche',
        collectiviteId: collectivite.data.id,
        statut: 'À venir',
      },
    ]);
    page.goto('/');

    console.log('createdFicheIds', createdFicheIds);

    const listFichesPom = new ListFichesPom(page);
    await listFichesPom.goto();
  });

  test('Recherche texte', async ({ page }) => {
    const listFichesPom = new ListFichesPom(page);

    await listFichesPom.expectFichesCount(2);
    await listFichesPom.search('toto');
    await expect(listFichesPom.noFicheHeading).toBeVisible();

    await listFichesPom.search('test');
    await listFichesPom.expectFichesCount(1);
  });

  test('Filtrer par statut', async ({ page }) => {
    const listFichesPom = new ListFichesPom(page);

    await listFichesPom.expectFichesCount(2);
    await listFichesPom.openFilter();

    const filterFichesPom = new FilterFichesPom(page);
    await filterFichesPom.selectStatut('À venir');
    await listFichesPom.expectFichesCount(1);
  });
});
