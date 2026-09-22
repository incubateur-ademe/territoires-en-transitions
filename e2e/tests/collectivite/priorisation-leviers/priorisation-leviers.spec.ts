import { expect } from '@playwright/test';
import { LevierMobilisation } from '@tet/backend/collectivites/analysis/mobilisation.repository';
import { Levier, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { PriorisationLeviersPom } from './priorisation-leviers.pom';

const LEVIER_COUNT = 29;
const MOBILISED_LEVIER_NOM: Levier = 'Vélo et transport en commun';

const mobilisationWithTwoFiches: LevierMobilisation[] = [
  {
    levierId: 'velo_transport_commun',
    volets: [
      { categorie: 'amenagement', note: 2, ficheIds: [1] },
      { categorie: 'financement', note: 0, ficheIds: [1, 2] },
    ],
  },
];

test.describe('Priorisation des leviers', () => {
  test("sans mobilisation, un membre voit les 29 leviers et l'absence d'actions rattachées", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(priorisationLeviersPom.levierNames).toHaveCount(LEVIER_COUNT);
    await expect(
      priorisationLeviersPom.missingMobilisationMessage
    ).toBeVisible();
  });

  test('un utilisateur vérifié non membre voit les 29 leviers', async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(priorisationLeviersPom.levierNames).toHaveCount(LEVIER_COUNT);
  });

  test("un utilisateur vérifié non membre ne voit pas les leviers d'une collectivité en accès restreint", async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({
      accesRestreint: true,
    });
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.open(collectivite.data.id);

    await expect(
      page.getByText("Cette collectivité n'est pas accessible en mode visite.")
    ).toBeVisible();
    await expect(priorisationLeviersPom.levierNames).toHaveCount(0);
  });

  test('un membre voit le nombre de fiches distinctes rattachées au levier', async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: mobilisationWithTwoFiches,
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(
      priorisationLeviersPom.levierCard(MOBILISED_LEVIER_NOM)
    ).toContainText('2 actions déjà rattachées');
    await expect(
      priorisationLeviersPom.missingMobilisationMessage
    ).toBeHidden();
  });

  test('un utilisateur vérifié non membre voit le même nombre de fiches rattachées', async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: mobilisationWithTwoFiches,
    });
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(
      priorisationLeviersPom.levierCard(MOBILISED_LEVIER_NOM)
    ).toContainText('2 actions déjà rattachées');
  });

  test('un admin qualifie un levier, et la valeur survit au rechargement', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);

    const pertinenceSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Non pertinent')
      .click();
    await pertinenceSaved;
    await page.reload();

    await expect(
      priorisationLeviersPom.pertinenceButton(
        LEVIER_NOM_BY_ID.biogaz,
        'Non pertinent'
      )
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('un admin qualifie un levier au clavier seul', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    const pertinentButton = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Pertinent'
    );

    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Non pertinent')
      .focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(pertinentButton).toBeFocused();
    const pertinenceSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      pertinence: 'pertinent',
    });
    await page.keyboard.press('Enter');
    await pertinenceSaved;
    await page.reload();

    await expect(pertinentButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('deux leviers qualifiés coup sur coup sont tous deux enregistrés', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    const biogazNonPertinent = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Non pertinent'
    );
    const covoiturageNonPertinent = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.covoiturage,
      'Non pertinent'
    );

    const pertinencesSaved = Promise.all([
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'biogaz',
        pertinence: 'non_pertinent',
      }),
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'covoiturage',
        pertinence: 'non_pertinent',
      }),
    ]);
    await biogazNonPertinent.click();
    await covoiturageNonPertinent.click();
    await pertinencesSaved;

    await expect(biogazNonPertinent).toHaveAttribute('aria-pressed', 'true');
    await expect(covoiturageNonPertinent).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await page.reload();

    await expect(biogazNonPertinent).toHaveAttribute('aria-pressed', 'true');
    await expect(covoiturageNonPertinent).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test("deux clics coup sur coup sur un même levier : le dernier l'emporte, même si le premier tarde", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await priorisationLeviersPom.delayPertinenceSave({
      saveIndex: 0,
      delayMs: 1_000,
    });
    const nonPertinentButton = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Non pertinent'
    );

    const pertinencesSaved = Promise.all([
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'biogaz',
        pertinence: 'pertinent',
      }),
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'biogaz',
        pertinence: 'non_pertinent',
      }),
    ]);
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Pertinent')
      .click();
    await nonPertinentButton.click();
    await expect(nonPertinentButton).toHaveAttribute('aria-pressed', 'true');
    await pertinencesSaved;
    await page.reload();

    await expect(nonPertinentButton).toHaveAttribute('aria-pressed', 'true');
  });

  test("la liste n'est relue qu'une fois, après la dernière écriture de la file", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await expect(priorisationLeviersPom.pertinenceSelectors).toHaveCount(
      LEVIER_COUNT
    );
    await priorisationLeviersPom.delayPertinenceSave({
      saveIndex: 0,
      delayMs: 1_000,
    });
    const trafficEvents = priorisationLeviersPom.recordPertinenceTraffic();

    const pertinencesSaved = Promise.all([
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'biogaz',
        pertinence: 'non_pertinent',
      }),
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'covoiturage',
        pertinence: 'non_pertinent',
      }),
    ]);
    const pertinencesReloaded =
      priorisationLeviersPom.waitForPertinencesReloaded();
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Non pertinent')
      .click();
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.covoiturage, 'Non pertinent')
      .click();
    await pertinencesSaved;
    await pertinencesReloaded;

    expect(trafficEvents).toEqual([
      'upsert-response',
      'upsert-response',
      'list-request',
    ]);
  });

  test("une écriture refusée par le serveur rend la valeur d'avant et affiche l'erreur", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    const nonPertinentButton = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Non pertinent'
    );
    const pertinentButton = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Pertinent'
    );
    const pertinenceSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });
    await nonPertinentButton.click();
    await pertinenceSaved;

    await priorisationLeviersPom.failEveryPertinenceSave();
    await pertinentButton.click();

    await expect(pertinentButton).toHaveAttribute('aria-pressed', 'false');
    await expect(nonPertinentButton).toHaveAttribute('aria-pressed', 'true');
    await expect(priorisationLeviersPom.saveErrorToast).toBeVisible();
  });

  test('un membre en édition lit la pertinence en texte, sans sélecteur', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.EDITION },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(
      priorisationLeviersPom.levierCard(LEVIER_NOM_BY_ID.biogaz)
    ).toContainText('Pertinence : non renseignée');
    await expect(priorisationLeviersPom.pertinenceSelectors).toHaveCount(0);
  });
});
