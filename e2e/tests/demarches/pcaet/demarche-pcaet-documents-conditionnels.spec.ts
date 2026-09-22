import { expect } from '@playwright/test';
import { addTestCommunesMembres } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import { DemarchePcaetPom } from './demarche-pcaet.pom';

/**
 * On repère les pièces par leur identifiant, pas par leur libellé : le nom vient
 * du catalogue en base, il se renomme sans prévenir, et son apostrophe n'est pas
 * celle des libellés du code.
 */
const ligneDocument = (documentId: string) =>
  `demarches.pcaet.documents.televerser.${documentId}`;

const PLAN_QUALITE_AIR = ligneDocument('pcaet_plan_qualite_air');
const PLAN_CHALEUR_FROID = ligneDocument('pcaet_plan_chaleur_froid');
const PROGRAMME_ACTIONS = ligneDocument('pcaet_plan_actions');

test.describe('Démarche PCAET - pièces attendues des seules collectivités assujetties', () => {
  test('un EPCI à fiscalité propre de plus de 100 000 habitants avec une commune de plus de 45 000 se voit demander les deux plans annexes', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { population: 684371, natureInsee: 'CA' },
      userArgs: { autoLogin: true },
    });
    // Le plan chaleur et froid se lit sur les communes membres, pas sur la
    // population du groupement.
    const communes = await addTestCommunesMembres(databaseService, {
      parentId: collectivite.data.id,
      populations: [500000],
    });
    collectivites.registerCleanupFunc({
      cleanupByCollectiviteId: async () => communes.cleanup(),
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.gotoDocuments();

    const table = demarchePcaetPom.documentsTable('amont');
    await expect(table).toBeVisible();
    await expect(table.getByTestId(PLAN_QUALITE_AIR)).toBeVisible();
    await expect(table.getByTestId(PLAN_CHALEUR_FROID)).toBeVisible();
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
    // Le dossier reste celui de tout le monde : le programme d'actions est bien
    // là, les deux plans annexes n'y sont pas.
    await expect(table.getByTestId(PROGRAMME_ACTIONS)).toBeVisible();
    await expect(table.getByTestId(PLAN_QUALITE_AIR)).toHaveCount(0);
    await expect(table.getByTestId(PLAN_CHALEUR_FROID)).toHaveCount(0);
  });
});
