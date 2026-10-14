import { expect } from '@playwright/test';
import { categorieActionEnumValues } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { addMobilisationAvecFiche } from './priorisation-leviers.fixture';
import {
  PriorisationLeviersPom,
  TourButtonName,
} from './priorisation-leviers.pom';
import { PRIORISATION_TOUR_STORAGE } from './priorisation-tour.storage';

const INTRO_STEP = 'Votre parcours en 3 étapes';
const MATRIX_STEP = 'La matrice des leviers';
const POINT_STEP = 'Commencez par le rouge';
const LEVIER_STEP = 'Le détail du levier';
const ACTIONS_STEP = 'Retenez ce qui est pertinent';
const HELP_STEP = 'Retrouvez la visite ici';
const LEVIER_TO_PRIORITIZE = 'Véhicules électriques';
const FULL_MOBILISATION_NOTE = 3;

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

  test('démarre sur le parcours et compte trois étapes', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);

    await pom.goto(collectivite.data.id);

    await expect(pom.tourStep(INTRO_STEP)).toBeVisible();
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await expect(pom.tourStep(INTRO_STEP)).toBeVisible();

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
      await addMobilisationAvecFiche(collectivite.data.id);
      const pom = new PriorisationLeviersPom(page);
      await pom.goto(collectivite.data.id);
      await expect(pom.tourStep(INTRO_STEP)).toBeVisible();
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

const startTourWithLevierToPrioritize = async ({
  pom,
  collectiviteId,
}: {
  pom: PriorisationLeviersPom;
  collectiviteId: number;
}): Promise<void> => {
  await pom.stubLevierWithPotentiel(LEVIER_TO_PRIORITIZE);
  await pom.goto(collectiviteId);
  await expect(pom.tourStep(INTRO_STEP)).toBeVisible();
};

const openLevierFromTour = async (
  pom: PriorisationLeviersPom
): Promise<void> => {
  await pom.tourButton('Suivant').click();
  await expect(pom.tourStep(MATRIX_STEP)).toBeVisible();
  await pom.tourButton('Suivant').click();
  await expect(pom.tourStep(POINT_STEP)).toBeVisible();
  await pom.tourButton('Ouvrir ce levier').click();
  await expect(pom.tourStep(LEVIER_STEP)).toBeVisible();
};

test.describe('Priorisation : visite guidée avec un levier en angle mort', () => {
  test.use({ priorisationTour: 'shown' });

  test('ajoute le levier à prioriser, son détail et ses actions, et ouvre le levier au détail', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await startTourWithLevierToPrioritize({
      pom,
      collectiviteId: collectivite.data.id,
    });
    await expect(pom.tourProgress).toHaveAttribute(
      'aria-valuetext',
      'Étape 1 sur 6'
    );
    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(MATRIX_STEP)).toBeVisible();
    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(POINT_STEP)).toBeVisible();
    await expect(pom.tourButton('Suivant')).toHaveCount(0);
    await expect(pom.levierPanel(LEVIER_TO_PRIORITIZE)).toHaveCount(0);

    await pom.tourButton('Ouvrir ce levier').click();

    await expect(pom.tourStep(LEVIER_STEP)).toBeVisible();
    await expect(pom.levierPanel(LEVIER_TO_PRIORITIZE)).toBeVisible();
    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(ACTIONS_STEP)).toBeVisible();
    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(HELP_STEP)).toBeVisible();
    await expect(pom.tourProgress).toHaveAttribute(
      'aria-valuetext',
      'Étape 6 sur 6'
    );
  });

  test('« Passer la visite » sur le détail du levier referme le levier', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await startTourWithLevierToPrioritize({
      pom,
      collectiviteId: collectivite.data.id,
    });
    await openLevierFromTour(pom);
    await expect(pom.levierPanel(LEVIER_TO_PRIORITIZE)).toBeVisible();

    await pom.tourButton('Passer la visite').click();

    await expect(pom.tourDialogs).toHaveCount(0);
    await expect(pom.levierPanel(LEVIER_TO_PRIORITIZE)).toHaveCount(0);
  });

  test('« Terminer » à la dernière étape laisse le levier ouvert', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await startTourWithLevierToPrioritize({
      pom,
      collectiviteId: collectivite.data.id,
    });
    await openLevierFromTour(pom);
    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(ACTIONS_STEP)).toBeVisible();
    await pom.tourButton('Suivant').click();
    await expect(pom.tourStep(HELP_STEP)).toBeVisible();

    await pom.tourButton('Terminer').click();

    await expect(pom.tourDialogs).toHaveCount(0);
    await expect(pom.levierPanel(LEVIER_TO_PRIORITIZE)).toBeVisible();
  });

  test('pendant la visite, le champ de pertinence du levier ouvert ne reçoit pas les clics', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    await collectivite.setUserCollectiviteRole(CollectiviteRole.ADMIN);
    const pom = new PriorisationLeviersPom(page);
    await startTourWithLevierToPrioritize({
      pom,
      collectiviteId: collectivite.data.id,
    });
    await openLevierFromTour(pom);

    const receivesClicks = await pom
      .pertinenceButton(LEVIER_TO_PRIORITIZE, 'Levier non pertinent')
      .evaluate((button) => {
        const { x, y, width, height } = button.getBoundingClientRect();
        return button.contains(
          document.elementFromPoint(x + width / 2, y + height / 2)
        );
      });

    expect(receivesClicks).toBe(false);
  });
});

test.describe('Priorisation : visite guidée sans levier en angle mort', () => {
  test.use({ priorisationTour: 'shown' });

  test('ouvre le levier au plus fort impact même quand il est bien mobilisé', async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: [
        {
          levierId: 'vehicules_electriques',
          volets: categorieActionEnumValues.map((categorie) => ({
            categorie,
            note: FULL_MOBILISATION_NOTE,
            ficheIds: [1],
          })),
        },
      ],
    });
    const pom = new PriorisationLeviersPom(page);
    await startTourWithLevierToPrioritize({
      pom,
      collectiviteId: collectivite.data.id,
    });
    await expect(pom.tourProgress).toHaveAttribute(
      'aria-valuetext',
      'Étape 1 sur 6'
    );

    await openLevierFromTour(pom);

    await expect(pom.levierPanel(LEVIER_TO_PRIORITIZE)).toBeVisible();
  });
});

test.describe('Priorisation : « Comment ça marche ? » relance la visite', () => {
  test('relance la visite déjà vue, sur la première étape', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.waitForLeviersLoaded();
    await expect(pom.tourDialogs).toHaveCount(0);

    await pom.helpButton.click();

    await expect(pom.tourStep(INTRO_STEP)).toBeVisible();
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.waitForLeviersLoaded();
    await pom.breakdownTab.click();
    await expect(pom.breakdownTab).toHaveAttribute('aria-selected', 'true');

    await pom.helpButton.click();
    await expect(pom.tourStep(INTRO_STEP)).toBeVisible();
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.waitForLeviersLoaded();

    await pom.helpButton.click();
    await expect(pom.tourStep(INTRO_STEP)).toBeVisible();
    await pom.tourButton('Suivant').click();
    await pom.tourButton('Passer la visite').click();
    await expect(pom.tourDialogs).toHaveCount(0);
    await pom.helpButton.click();

    await expect(pom.tourStep(INTRO_STEP)).toBeVisible();
    await expect(pom.tourDialogs).toHaveCount(1);
  });
});
