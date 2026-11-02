import { expect } from '@playwright/test';
import { LevierMobilisation } from '@tet/backend/collectivites/analysis/mobilisation.repository';
import { LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { addMobilisationAvecFiche } from './priorisation-leviers.fixture';
import { PriorisationLeviersPom } from './priorisation-leviers.pom';

const LEVIER_COUNT = 29;

const toMobilisationCitingInTwoLeviers = (
  ficheId: number
): LevierMobilisation[] => [
  {
    levierId: 'velo_transport_commun',
    volets: [{ categorie: 'amenagement', note: 2, ficheIds: [ficheId] }],
  },
  {
    levierId: 'covoiturage',
    volets: [{ categorie: 'financement', note: 1, ficheIds: [ficheId] }],
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

    await expect(priorisationLeviersPom.levierButtons).toHaveCount(
      LEVIER_COUNT
    );
    await expect(
      priorisationLeviersPom.missingMobilisationMessage
    ).toBeVisible();
  });

  test('un utilisateur vérifié non membre est renvoyé vers le tableau de bord de la collectivité', async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.open(collectivite.data.id);

    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${collectivite.data.id}/tableau-de-bord`)
    );
    await expect(priorisationLeviersPom.levierButtons).toHaveCount(0);
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
    await expect(priorisationLeviersPom.levierButtons).toHaveCount(0);
  });

  test("un membre voit le nombre d'actions analysées, qu'elles soient rattachées à un levier ou non", async ({
    collectivites,
    fiches,
    mobilisations,
    page,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const [
      ficheInTwoLeviers,
      ficheWithoutLevier,
      ficheModifiedSinceAnalysis,
      ficheWithFailedAnalysis,
    ] = await fiches.create(
      user,
      ['Pistes cyclables', 'Fête de la ville', 'Covoiturage', 'Archives'].map(
        (titre) => ({ titre, collectiviteId })
      )
    );
    await mobilisations.add({
      collectiviteId,
      leviers: toMobilisationCitingInTwoLeviers(ficheInTwoLeviers),
    });
    await mobilisations.addFicheAnalyses({
      collectiviteId,
      analyses: [
        { ficheId: ficheInTwoLeviers, status: 'processed' },
        { ficheId: ficheWithoutLevier, status: 'processed' },
        { ficheId: ficheModifiedSinceAnalysis, status: 'stale' },
        { ficheId: ficheWithFailedAnalysis, status: 'failed' },
      ],
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectiviteId);

    await expect(priorisationLeviersPom.analyzedActionsText).toContainText(
      'Analyse de 3 actions'
    );
    await expect(
      priorisationLeviersPom.missingMobilisationMessage
    ).toBeHidden();
  });

  test('un membre en lecture est renvoyé vers le tableau de bord de la collectivité', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.LECTURE },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.open(collectivite.data.id);

    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${collectivite.data.id}/tableau-de-bord`)
    );
    await expect(priorisationLeviersPom.levierButtons).toHaveCount(0);
  });

  test('un admin qualifie un levier, et la valeur survit au rechargement', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);

    const pertinenceSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Levier non pertinent')
      .click();
    await pertinenceSaved;
    await page.reload();
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);

    await expect(
      priorisationLeviersPom.pertinenceButton(
        LEVIER_NOM_BY_ID.biogaz,
        'Levier pertinent'
      )
    ).toBeVisible();
  });

  test('un admin qualifie un levier au clavier seul', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);
    const marquerPertinentButton = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Levier pertinent'
    );

    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Levier non pertinent')
      .focus();
    const nonPertinentSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });
    await page.keyboard.press('Enter');
    await nonPertinentSaved;
    await expect(marquerPertinentButton).toBeFocused();
    const pertinentSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      pertinence: 'pertinent',
    });
    await page.keyboard.press('Enter');
    await pertinentSaved;
    await page.reload();
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);

    await expect(
      priorisationLeviersPom.pertinenceButton(
        LEVIER_NOM_BY_ID.biogaz,
        'Levier non pertinent'
      )
    ).toBeVisible();
  });

  test('deux leviers qualifiés coup sur coup sont tous deux enregistrés', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    const biogazMarquerPertinent = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Levier pertinent'
    );
    const covoiturageMarquerPertinent = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.covoiturage,
      'Levier pertinent'
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
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Levier non pertinent')
      .click();
    await expect(biogazMarquerPertinent).toBeVisible();
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.covoiturage);
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.covoiturage, 'Levier non pertinent')
      .click();
    await expect(covoiturageMarquerPertinent).toBeVisible();
    await pertinencesSaved;

    await page.reload();

    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);
    await expect(biogazMarquerPertinent).toBeVisible();
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.covoiturage);
    await expect(covoiturageMarquerPertinent).toBeVisible();
  });

  test("deux clics coup sur coup sur un même levier : le dernier l'emporte, même si le premier tarde", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);
    await priorisationLeviersPom.delayPertinenceSave({
      saveIndex: 0,
      delayMs: 1_000,
    });
    const marquerNonPertinentButton = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Levier non pertinent'
    );

    const pertinencesSaved = Promise.all([
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'biogaz',
        pertinence: 'non_pertinent',
      }),
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'biogaz',
        pertinence: 'pertinent',
      }),
    ]);
    await marquerNonPertinentButton.click();
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Levier pertinent')
      .click();
    await expect(marquerNonPertinentButton).toBeVisible();
    await pertinencesSaved;
    await page.reload();
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);

    await expect(marquerNonPertinentButton).toBeVisible();
  });

  test("la liste n'est relue qu'une fois, après la dernière écriture de la file", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await expect(priorisationLeviersPom.levierButtons).toHaveCount(
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
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Levier non pertinent')
      .click();
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.covoiturage);
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.covoiturage, 'Levier non pertinent')
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);
    const marquerPertinentButton = priorisationLeviersPom.pertinenceButton(
      LEVIER_NOM_BY_ID.biogaz,
      'Levier pertinent'
    );
    const pertinenceSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
    });
    await priorisationLeviersPom
      .pertinenceButton(LEVIER_NOM_BY_ID.biogaz, 'Levier non pertinent')
      .click();
    await pertinenceSaved;

    await priorisationLeviersPom.failEveryPertinenceSave();
    await marquerPertinentButton.click();

    await expect(priorisationLeviersPom.saveErrorToast).toBeVisible();
    await expect(marquerPertinentButton).toBeVisible();
  });

  test('un membre en édition ne voit ni bouton ni texte de pertinence', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.EDITION },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await priorisationLeviersPom.openLevier(LEVIER_NOM_BY_ID.biogaz);

    await expect(
      priorisationLeviersPom.levierPanel(LEVIER_NOM_BY_ID.biogaz)
    ).not.toContainText('Pertinence');
    await expect(priorisationLeviersPom.pertinenceToggles).toHaveCount(0);
  });
});
