import { expect } from '@playwright/test';
import { Levier, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import {
  NewActionDeReference,
  testWithActionsDeReference as test,
  withRunSuffix,
} from 'tests/shared/actions-de-reference/actions-de-reference.fixture';
import { PriorisationLeviersPom } from './priorisation-leviers.pom';

const LEVIER_NOM: Levier = LEVIER_NOM_BY_ID.covoiturage;
const AUTRE_LEVIER_NOM: Levier = LEVIER_NOM_BY_ID.biogaz;

const toCovoiturageActions = (
  runToken: string
): readonly [NewActionDeReference, NewActionDeReference] => [
  {
    titre: withRunSuffix('Voie réservée au covoiturage', runToken),
    description: 'Réserver une voie aux véhicules à plusieurs occupants.',
    levier: 'covoiturage',
    categorie: 'amenagement',
  },
  {
    titre: withRunSuffix('Prime au covoiturage domicile-travail', runToken),
    description: 'Verser une prime aux salariés qui covoiturent.',
    levier: 'covoiturage',
    categorie: 'financement',
  },
];

const toBiogazAction = (runToken: string): NewActionDeReference => ({
  titre: withRunSuffix('Unité de méthanisation territoriale', runToken),
  description: 'Accompagner un projet de méthanisation agricole.',
  levier: 'biogaz',
  categorie: 'gouvernance',
});

test.describe('Priorisation : matrice et volet', () => {
  test('sans trajectoire SNBC, la page prévient et liste les 29 leviers hors matrice', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);

    await pom.goto(collectivite.data.id);

    await expect(pom.missingPotentielsMessage).toBeVisible();
    await expect(pom.levierButtons).toHaveCount(29);
    await expect(pom.metricCount(/^actions? à potentiel/)).toHaveText('0');
    await expect(pom.metricCount(/leviers? en angle mort/)).toHaveText('0');
    await expect(pom.emptyPreselectionMessage).toBeVisible();
  });

  test('le tableau des données du graphique se déplie et se replie', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);

    await expect(pom.chartDataTable).toBeHidden();
    await pom.chartDataToggle.click();
    await expect(pom.chartDataTable).toBeVisible();
    await pom.chartDataToggle.click();
    await expect(pom.chartDataTable).toBeHidden();
  });

  test('le volet groupe les actions de référence du levier par catégorie', async ({
    collectivites,
    actionsDeReference,
    page,
  }) => {
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement, financement] = toCovoiturageActions(runToken);
    await actionsDeReference.add([amenagement, financement]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);

    await pom.openLevier(LEVIER_NOM);

    await expect(
      pom.categorieHeading(LEVIER_NOM, 'Aménagement & infrastructures')
    ).toBeVisible();
    await expect(
      pom.categorieHeading(LEVIER_NOM, 'Financement & fiscalité')
    ).toBeVisible();
    await expect(
      pom.actionCardInPanel(LEVIER_NOM, amenagement.titre)
    ).toBeVisible();
    await expect(
      pom.actionCardInPanel(LEVIER_NOM, financement.titre)
    ).toBeVisible();
  });

  test(
    'un levier sans action de référence le dit',
    { tag: '@serial' },
    async ({ collectivites, actionsDeReference, page }) => {
      await actionsDeReference.removeAll();
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
      const pom = new PriorisationLeviersPom(page);
      await pom.goto(collectivite.data.id);

      await pom.openLevier(LEVIER_NOM);

      await expect(pom.noActionMessage(LEVIER_NOM)).toBeVisible();
    }
  );

  test('la recherche filtre les actions du volet par titre, et dit quand rien ne correspond', async ({
    collectivites,
    actionsDeReference,
    page,
  }) => {
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement, financement] = toCovoiturageActions(runToken);
    await actionsDeReference.add([amenagement, financement]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);

    await pom.actionSearch(LEVIER_NOM).fill('prime');
    await pom.actionSearch(LEVIER_NOM).press('Enter');

    await expect(
      pom.actionCardInPanel(LEVIER_NOM, financement.titre)
    ).toBeVisible();
    await expect(
      pom.actionCardInPanel(LEVIER_NOM, amenagement.titre)
    ).toBeHidden();

    await pom.actionSearch(LEVIER_NOM).fill(runToken);
    await pom.actionSearch(LEVIER_NOM).press('Enter');

    await expect(pom.actionsTrouveesCount(LEVIER_NOM)).toHaveText(
      '2 actions de référence trouvées'
    );

    await pom.actionSearch(LEVIER_NOM).fill(`introuvable-${runToken}`);
    await pom.actionSearch(LEVIER_NOM).press('Enter');

    await expect(pom.noMatchingActionMessage(LEVIER_NOM)).toBeVisible();
  });
});

test.describe('Priorisation : présélection', () => {
  test('ajouter une action la place dans la présélection, colore son levier, et survit au rechargement', async ({
    collectivites,
    actionsDeReference,
    page,
  }) => {
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement] = toCovoiturageActions(runToken);
    await actionsDeReference.add([amenagement]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    const card = pom.actionCardInPanel(LEVIER_NOM, amenagement.titre);

    await card
      .getByRole('button', { name: 'Ajouter à la présélection' })
      .click();

    await expect(card.getByRole('button', { name: 'Ajoutée' })).toBeVisible();
    await expect(pom.preselectedCard(amenagement.titre)).toBeVisible();
    await expect(pom.metricCount(/^actions? à potentiel/)).toHaveText('1');

    await page.reload();
    await expect(pom.title).toBeVisible();

    await expect(pom.preselectedCard(amenagement.titre)).toBeVisible();
    await expect(pom.metricCount(/^actions? à potentiel/)).toHaveText('1');
  });

  test("« Pas intéressé » range l'action dans un accordéon, « Rétablir » la ressort", async ({
    collectivites,
    actionsDeReference,
    page,
  }) => {
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement, financement] = toCovoiturageActions(runToken);
    await actionsDeReference.add([amenagement, financement]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);

    await pom
      .actionCardInPanel(LEVIER_NOM, amenagement.titre)
      .getByRole('button', { name: 'Pas intéressé' })
      .click();

    const accordion = pom.ignoredActionsAccordion(LEVIER_NOM);
    await expect(accordion).toHaveText(/1 action marquée/);
    await expect(
      pom.actionCardInPanel(LEVIER_NOM, amenagement.titre)
    ).toBeHidden();

    await accordion.click();
    await pom
      .actionCardInPanel(LEVIER_NOM, amenagement.titre)
      .getByRole('button', { name: 'Rétablir' })
      .click();

    await expect(accordion).toBeHidden();
    await expect(
      pom
        .actionCardInPanel(LEVIER_NOM, amenagement.titre)
        .getByRole('button', { name: 'Ajouter à la présélection' })
    ).toBeVisible();
  });

  test('« Retirer » sort une action de la présélection', async ({
    collectivites,
    actionsDeReference,
    page,
  }) => {
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement] = toCovoiturageActions(runToken);
    await actionsDeReference.add([amenagement]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    await pom
      .actionCardInPanel(LEVIER_NOM, amenagement.titre)
      .getByRole('button', { name: 'Ajouter à la présélection' })
      .click();
    await expect(pom.preselectedCard(amenagement.titre)).toBeVisible();

    await pom
      .preselectedCard(amenagement.titre)
      .getByRole('button', { name: 'Retirer' })
      .click();

    await expect(pom.emptyPreselectionMessage).toBeVisible();
    await expect(
      pom
        .actionCardInPanel(LEVIER_NOM, amenagement.titre)
        .getByRole('button', { name: 'Ajouter à la présélection' })
    ).toBeVisible();
  });

  test('les filtres par levier et par catégorie réduisent la présélection', async ({
    collectivites,
    actionsDeReference,
    page,
  }) => {
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement, financement] = toCovoiturageActions(runToken);
    const biogaz = toBiogazAction(runToken);
    await actionsDeReference.add([amenagement, financement, biogaz]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    for (const action of [amenagement, financement]) {
      await pom
        .actionCardInPanel(LEVIER_NOM, action.titre)
        .getByRole('button', { name: 'Ajouter à la présélection' })
        .click();
    }
    await pom.openLevier(AUTRE_LEVIER_NOM);
    await pom
      .actionCardInPanel(AUTRE_LEVIER_NOM, biogaz.titre)
      .getByRole('button', { name: 'Ajouter à la présélection' })
      .click();
    await expect(pom.preselectedCards).toHaveCount(3);

    await pom.chooseFilter('Tous les leviers', 'covoiturage');
    await expect(pom.preselectedCards).toHaveCount(2);

    await pom.chooseFilter('Toutes les catégories', 'financement');
    await expect(pom.preselectedCards).toHaveCount(1);
    await expect(pom.preselectedCard(financement.titre)).toBeVisible();
  });
});

test.describe('Priorisation : ajout à un plan', () => {
  test("ajouter une action au plan crée une fiche dans ce plan, et l'annulation la supprime", async ({
    collectivites,
    actionsDeReference,
    plans,
    fiches,
    page,
  }) => {
    void fiches;
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement] = toCovoiturageActions(runToken);
    await actionsDeReference.add([amenagement]);
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const planNom = `Plan climat ${runToken}`;
    await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    await pom
      .actionCardInPanel(LEVIER_NOM, amenagement.titre)
      .getByRole('button', { name: 'Ajouter à la présélection' })
      .click();
    await expect(pom.addToPlanButton(amenagement.titre)).toHaveText(
      `Ajouter à « ${planNom} »`
    );

    const ficheCreated = pom.waitForFicheCreated();
    await pom.addToPlanButton(amenagement.titre).click();
    await ficheCreated;

    await expect(
      pom.addedToPlanStatus(amenagement.titre, planNom)
    ).toBeVisible();
    const listedFiches = await user
      .getTrpcClient()
      .plans.fiches.listFiches.query({
        collectiviteId: collectivite.data.id,
      });
    expect(listedFiches.data.map((fiche) => fiche.titre)).toContain(
      amenagement.titre
    );

    await page.reload();
    await expect(pom.title).toBeVisible();
    await expect(
      pom.addedToPlanStatus(amenagement.titre, planNom)
    ).toBeVisible();

    const ficheDeleted = pom.waitForFicheDeleted();
    await pom.undoAddToPlanButton(amenagement.titre).click();
    await ficheDeleted;

    await expect(pom.addToPlanButton(amenagement.titre)).toBeVisible();
    const fichesAfterUndo = await user
      .getTrpcClient()
      .plans.fiches.listFiches.query({
        collectiviteId: collectivite.data.id,
      });
    expect(fichesAfterUndo.data.map((fiche) => fiche.titre)).not.toContain(
      amenagement.titre
    );
  });

  test('le menu du bouton scindé propose chaque plan de la collectivité', async ({
    collectivites,
    actionsDeReference,
    plans,
    fiches,
    page,
  }) => {
    void fiches;
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement] = toCovoiturageActions(runToken);
    await actionsDeReference.add([amenagement]);
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });
    const premierPlan = `A ${runToken}`;
    const secondPlan = `B ${runToken}`;
    await plans.create(user, {
      nom: premierPlan,
      collectiviteId: collectivite.data.id,
    });
    await plans.create(user, {
      nom: secondPlan,
      collectiviteId: collectivite.data.id,
    });
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    await pom
      .actionCardInPanel(LEVIER_NOM, amenagement.titre)
      .getByRole('button', { name: 'Ajouter à la présélection' })
      .click();

    await pom.otherPlansButton(amenagement.titre).click();

    await expect(pom.planMenuEntry(premierPlan)).toBeVisible();
    await expect(pom.planMenuEntry(secondPlan)).toBeVisible();

    const ficheCreated = pom.waitForFicheCreated();
    await pom.planMenuEntry(secondPlan).click();
    await ficheCreated;

    await expect(
      pom.addedToPlanStatus(amenagement.titre, secondPlan)
    ).toBeVisible();
  });
});
