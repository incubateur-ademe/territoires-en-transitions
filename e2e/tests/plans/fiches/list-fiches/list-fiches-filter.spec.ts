import { expect } from '@playwright/test';
import { testWithFiches as test } from '../fiches.fixture';

test.describe('Liste des fiches', () => {
  test.beforeEach(async ({ page, collectivites, fiches, listFichesPom }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    console.log(`Create fiches`);
    const createdFicheIds = await fiches.create(user, [
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
    await listFichesPom.goto();
  });

  test('Recherche texte', async ({ listFichesPom }) => {
    await listFichesPom.expectFichesCount(2);
    await listFichesPom.search('toto');
    await expect(listFichesPom.noFicheHeading).toBeVisible();

    await listFichesPom.search('test');
    await listFichesPom.expectFichesCount(1);
  });

  test('Filtrer par statut', async ({ listFichesPom, filterFichesPom }) => {
    await listFichesPom.expectFichesCount(2);
    await listFichesPom.openFilter();
    await filterFichesPom.selectStatut('À venir');
    await listFichesPom.expectFichesCount(1);
  });
});
