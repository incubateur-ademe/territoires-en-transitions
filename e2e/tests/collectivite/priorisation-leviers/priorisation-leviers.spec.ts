import { expect } from '@playwright/test';
import { LevierMobilisation } from '@tet/backend/collectivites/analysis/mobilisation.repository';
import { Levier, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { PriorisationLeviersPom } from './priorisation-leviers.pom';

const LEVIER_COUNT = 29;
const CATEGORIE_COUNT = 6;
const MOBILISED_CATEGORIE_COUNT = 2;
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

  test("un membre déplie au clavier les six catégories d'un levier encore non qualifié", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await expect(priorisationLeviersPom.levierNames).toHaveCount(LEVIER_COUNT);

    await priorisationLeviersPom.openCategoriesWithEnter(
      LEVIER_NOM_BY_ID.biogaz
    );

    await expect(
      priorisationLeviersPom.categorieRows(LEVIER_NOM_BY_ID.biogaz)
    ).toHaveCount(CATEGORIE_COUNT);
    await expect(
      priorisationLeviersPom.categorieRow(
        LEVIER_NOM_BY_ID.biogaz,
        'Aménagement & infrastructures'
      )
    ).toContainText('Pertinence : non renseignée');
  });

  test('un membre voit les actions rattachées à chaque catégorie mobilisée', async ({
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
    await expect(priorisationLeviersPom.levierNames).toHaveCount(LEVIER_COUNT);

    await priorisationLeviersPom.openCategoriesWithEnter(MOBILISED_LEVIER_NOM);

    await expect(
      priorisationLeviersPom.categorieRow(
        MOBILISED_LEVIER_NOM,
        'Financement & fiscalité'
      )
    ).toContainText('2 actions déjà rattachées');
    await expect(
      priorisationLeviersPom.categorieRow(
        MOBILISED_LEVIER_NOM,
        'Aménagement & infrastructures'
      )
    ).toContainText('1 action déjà rattachée');
  });

  test("les catégories non mobilisées héritent de la non-pertinence du levier, l'accordéon reste ouvert", async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: mobilisationWithTwoFiches,
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await expect(priorisationLeviersPom.pertinenceSelectors).toHaveCount(
      LEVIER_COUNT
    );
    await priorisationLeviersPom.openCategoriesWithEnter(MOBILISED_LEVIER_NOM);
    const gouvernanceRow = priorisationLeviersPom.categorieRow(
      MOBILISED_LEVIER_NOM,
      'Gouvernance & partenariats'
    );
    await expect(
      priorisationLeviersPom.categoriePertinenceSelector(
        MOBILISED_LEVIER_NOM,
        'Gouvernance & partenariats'
      )
    ).toBeVisible();

    const pertinenceSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'velo_transport_commun',
      pertinence: 'non_pertinent',
    });
    const pertinencesReloaded =
      priorisationLeviersPom.waitForPertinencesReloaded();
    await priorisationLeviersPom
      .pertinenceButton(MOBILISED_LEVIER_NOM, 'Non pertinent')
      .click();
    await pertinenceSaved;
    await pertinencesReloaded;

    await expect(gouvernanceRow).toContainText(
      'Non pertinent, comme le levier'
    );
    await expect(
      priorisationLeviersPom.categorieRow(
        MOBILISED_LEVIER_NOM,
        'Financement & fiscalité'
      )
    ).toContainText('2 actions déjà rattachées');
    await expect(
      priorisationLeviersPom.categoriesAccordion(MOBILISED_LEVIER_NOM)
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('un admin qualifie une catégorie, et la valeur survit au rechargement', async ({
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
    await priorisationLeviersPom.openCategoriesWithEnter(
      LEVIER_NOM_BY_ID.biogaz
    );
    const amenagementADiscuter =
      priorisationLeviersPom.categoriePertinenceButton(
        LEVIER_NOM_BY_ID.biogaz,
        'Aménagement & infrastructures',
        "À discuter avec l'élu"
      );

    const pertinenceSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'biogaz',
      categorie: 'amenagement',
      pertinence: 'a_discuter',
    });
    await amenagementADiscuter.click();
    await pertinenceSaved;
    await page.reload();
    await expect(priorisationLeviersPom.pertinenceSelectors).toHaveCount(
      LEVIER_COUNT
    );
    await priorisationLeviersPom.openCategoriesWithEnter(
      LEVIER_NOM_BY_ID.biogaz
    );

    await expect(amenagementADiscuter).toHaveAttribute('aria-pressed', 'true');
  });

  test("un volet mobilisé n'offre aucun sélecteur, ses voisins non mobilisés en offrent un", async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: mobilisationWithTwoFiches,
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await expect(priorisationLeviersPom.pertinenceSelectors).toHaveCount(
      LEVIER_COUNT
    );

    await priorisationLeviersPom.openCategoriesWithEnter(MOBILISED_LEVIER_NOM);

    await expect(
      priorisationLeviersPom.categorieRow(
        MOBILISED_LEVIER_NOM,
        'Financement & fiscalité'
      )
    ).toContainText('2 actions déjà rattachées');
    await expect(
      priorisationLeviersPom.categoriePertinenceSelector(
        MOBILISED_LEVIER_NOM,
        'Gouvernance & partenariats'
      )
    ).toBeVisible();
    await expect(
      priorisationLeviersPom.categoriePertinenceSelector(
        MOBILISED_LEVIER_NOM,
        'Financement & fiscalité'
      )
    ).toHaveCount(0);
    await expect(
      priorisationLeviersPom.categoriePertinenceSelectors(MOBILISED_LEVIER_NOM)
    ).toHaveCount(CATEGORIE_COUNT - MOBILISED_CATEGORIE_COUNT);
  });

  test('un levier repassé pertinent rend ses catégories vides, la qualification posée avant ne revient pas', async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: mobilisationWithTwoFiches,
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);
    await priorisationLeviersPom.goto(collectivite.data.id);
    await expect(priorisationLeviersPom.pertinenceSelectors).toHaveCount(
      LEVIER_COUNT
    );
    await priorisationLeviersPom.openCategoriesWithEnter(MOBILISED_LEVIER_NOM);
    const gouvernanceADiscuter =
      priorisationLeviersPom.categoriePertinenceButton(
        MOBILISED_LEVIER_NOM,
        'Gouvernance & partenariats',
        "À discuter avec l'élu"
      );

    const categorieSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'velo_transport_commun',
      categorie: 'gouvernance',
      pertinence: 'a_discuter',
    });
    const categorieReloaded =
      priorisationLeviersPom.waitForPertinencesReloaded();
    await gouvernanceADiscuter.click();
    await categorieSaved;
    await categorieReloaded;
    await expect(gouvernanceADiscuter).toHaveAttribute('aria-pressed', 'true');

    const levierNonPertinentSaved =
      priorisationLeviersPom.waitForPertinenceSaved({
        levierId: 'velo_transport_commun',
        pertinence: 'non_pertinent',
      });
    const levierNonPertinentReloaded =
      priorisationLeviersPom.waitForPertinencesReloaded();
    await priorisationLeviersPom
      .pertinenceButton(MOBILISED_LEVIER_NOM, 'Non pertinent')
      .click();
    await levierNonPertinentSaved;
    await levierNonPertinentReloaded;

    await expect(
      priorisationLeviersPom.categorieRow(
        MOBILISED_LEVIER_NOM,
        'Gouvernance & partenariats'
      )
    ).toContainText('Non pertinent, comme le levier');
    await expect(
      priorisationLeviersPom.categoriePertinenceSelectors(MOBILISED_LEVIER_NOM)
    ).toHaveCount(0);

    const levierPertinentSaved = priorisationLeviersPom.waitForPertinenceSaved({
      levierId: 'velo_transport_commun',
      pertinence: 'pertinent',
    });
    await priorisationLeviersPom
      .pertinenceButton(MOBILISED_LEVIER_NOM, 'Pertinent')
      .click();
    await levierPertinentSaved;
    await page.reload();
    await expect(priorisationLeviersPom.pertinenceSelectors).toHaveCount(
      LEVIER_COUNT
    );
    await priorisationLeviersPom.openCategoriesWithEnter(MOBILISED_LEVIER_NOM);

    await expect(gouvernanceADiscuter).toBeVisible();
    await expect(gouvernanceADiscuter).toHaveAttribute('aria-pressed', 'false');
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

    await priorisationLeviersPom.openCategoriesWithEnter(
      LEVIER_NOM_BY_ID.biogaz
    );

    await expect(
      priorisationLeviersPom.categorieRow(
        LEVIER_NOM_BY_ID.biogaz,
        'Aménagement & infrastructures'
      )
    ).toContainText('Pertinence : non renseignée');
    await expect(
      priorisationLeviersPom.categoriePertinenceSelectors(
        LEVIER_NOM_BY_ID.biogaz
      )
    ).toHaveCount(0);
  });
});
