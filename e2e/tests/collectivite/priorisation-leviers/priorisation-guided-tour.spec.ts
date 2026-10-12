import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import {
  PriorisationLeviersPom,
  TourButtonName,
} from './priorisation-leviers.pom';
import { PRIORISATION_TOUR_STORAGE } from './priorisation-tour.storage';

const METRICS_STEP = 'Votre point de départ';
const MATRIX_STEP = 'La matrice des leviers';
const HELP_STEP = 'Retrouvez la visite ici';

type TourEnding = {
  name: string;
  button: TourButtonName;
  nextClicksBefore: number;
};

const tourEndings: TourEnding[] = [
  {
    name: '« Passer la visite »',
    button: 'Passer la visite',
    nextClicksBefore: 0,
  },
  { name: 'la croix', button: 'Quitter la visite', nextClicksBefore: 0 },
  {
    name: '« Terminer » à la dernière étape',
    button: 'Terminer',
    nextClicksBefore: 2,
  },
];

test.describe('Priorisation : visite guidée à la première visite', () => {
  test.use({ priorisationTour: 'shown' });

  test('démarre sur les métriques et compte trois étapes', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);

    await pom.goto(collectivite.data.id);

    await expect(pom.tourStep(METRICS_STEP)).toBeVisible();
    await expect(pom.tourProgress).toHaveAttribute(
      'aria-valuetext',
      'Étape 1 sur 3'
    );
    await expect(pom.tourButton('Précédent')).toHaveCount(0);
  });

  test('« Suivant » enchaîne les trois étapes et « Précédent » revient en arrière', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await expect(pom.tourStep(METRICS_STEP)).toBeVisible();

    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(MATRIX_STEP)).toBeVisible();
    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(HELP_STEP)).toBeVisible();
    await expect(pom.tourButton('Terminer')).toBeVisible();
    await pom.tourButton('Précédent').click();

    await expect(pom.tourStep(MATRIX_STEP)).toBeVisible();
  });

  for (const ending of tourEndings) {
    test(`${ending.name} ferme la visite et elle ne revient pas après un rechargement`, async ({
      collectivites,
      page,
    }) => {
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
      const pom = new PriorisationLeviersPom(page);
      await pom.goto(collectivite.data.id);
      await expect(pom.tourStep(METRICS_STEP)).toBeVisible();
      for (let click = 0; click < ending.nextClicksBefore; click++) {
        await pom.tourButton('Suivant').click();
      }

      await pom.tourButton(ending.button).click();
      await expect(pom.tourDialogs).toHaveCount(0);
      const storedVersion = await page.evaluate(
        (key) => window.localStorage.getItem(key),
        PRIORISATION_TOUR_STORAGE.key
      );
      await page.reload();
      await pom.waitForLeviersLoaded();

      expect(storedVersion).toBe(PRIORISATION_TOUR_STORAGE.version);
      await expect(pom.tourDialogs).toHaveCount(0);
    });
  }
});

test.describe('Priorisation : « Comment ça marche ? » relance la visite', () => {
  test('relance la visite déjà vue, sur la première étape', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.waitForLeviersLoaded();
    await expect(pom.tourDialogs).toHaveCount(0);

    await pom.helpButton.click();

    await expect(pom.tourStep(METRICS_STEP)).toBeVisible();
    await expect(pom.tourProgress).toHaveAttribute(
      'aria-valuetext',
      'Étape 1 sur 3'
    );
  });

  test("relancée depuis un autre onglet, la visite remet la matrice à l'écran", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.waitForLeviersLoaded();
    await pom.breakdownTab.click();
    await expect(pom.breakdownTab).toHaveAttribute('aria-selected', 'true');

    await pom.helpButton.click();
    await expect(pom.tourStep(METRICS_STEP)).toBeVisible();
    await pom.tourButton('Suivant').click();

    await expect(pom.tourStep(MATRIX_STEP)).toBeVisible();
    await expect(pom.matrixTab).toHaveAttribute('aria-selected', 'true');
  });

  test('relancée après avoir été passée, la visite repart de la première étape dans une seule boîte de dialogue', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.waitForLeviersLoaded();

    await pom.helpButton.click();
    await expect(pom.tourStep(METRICS_STEP)).toBeVisible();
    await pom.tourButton('Suivant').click();
    await pom.tourButton('Passer la visite').click();
    await expect(pom.tourDialogs).toHaveCount(0);
    await pom.helpButton.click();

    await expect(pom.tourStep(METRICS_STEP)).toBeVisible();
    await expect(pom.tourDialogs).toHaveCount(1);
  });
});
