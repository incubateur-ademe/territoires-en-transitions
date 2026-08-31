import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { DemarchePcaetPom } from './demarche-pcaet.pom';

const PLAN_QUALITE_AIR = 'Plan d’actions de qualité de l’air';
const PLAN_CHALEUR_FROID = 'Plan local de chaleur et de froid';

test.describe('Démarche PCAET - pièces attendues des seules collectivités assujetties', () => {
  test('un EPCI à fiscalité propre de plus de 100 000 habitants se voit demander les deux plans annexes', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { population: 684371, natureInsee: 'CA' },
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.gotoDocuments();

    const table = demarchePcaetPom.documentsTable('amont');
    await expect(table).toBeVisible();
    await expect(table).toContainText(PLAN_QUALITE_AIR);
    await expect(table).toContainText(PLAN_CHALEUR_FROID);
  });

  test('une collectivité qui n’est assujettie à rien ne les voit pas', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { population: 10000, natureInsee: 'CA' },
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.gotoDocuments();

    const table = demarchePcaetPom.documentsTable('amont');
    await expect(table).toBeVisible();
    // Le dossier reste celui de tout le monde : les deux plans en sont absents.
    await expect(table).toContainText('Programme d’actions');
    await expect(table).not.toContainText(PLAN_QUALITE_AIR);
    await expect(table).not.toContainText(PLAN_CHALEUR_FROID);
  });
});
