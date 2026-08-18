import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { HistoriquePom } from './historique.pom';

test.describe('Historique — scope par référentiel', () => {
  test("n'affiche que les modifications du référentiel de la page", async ({
    page,
    collectivites,
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;

    await referentiels.updateActionStatut(user, {
      collectiviteId,
      actionId: 'cae_1.1.1.1.2',
      statut: 'fait',
    });
    await referentiels.updateActionStatut(user, {
      collectiviteId,
      actionId: 'eci_1.1.1.1',
      statut: 'fait',
    });

    const historiquePom = new HistoriquePom(page);

    await historiquePom.goto(collectiviteId, 'eci');
    await expect(historiquePom.items).toHaveCount(1);

    await historiquePom.goto(collectiviteId, 'cae');
    await expect(historiquePom.items).toHaveCount(1);
  });
});
