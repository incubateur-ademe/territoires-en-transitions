import { expect } from '@playwright/test';
import { Levier, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import {
  NewActionDeReference,
  testWithActionsDeReference as test,
  withRunSuffix,
} from 'tests/shared/actions-de-reference/actions-de-reference.fixture';
import { addMobilisationAvecFiche } from './priorisation-leviers.fixture';
import { PriorisationLeviersPom } from './priorisation-leviers.pom';

const LEVIER_NOM: Levier = LEVIER_NOM_BY_ID.covoiturage;
const AUTRE_LEVIER_NOM: Levier = LEVIER_NOM_BY_ID.biogaz;
const LEVIER_TO_PRIORITIZE: Levier = LEVIER_NOM_BY_ID.vehicules_electriques;

const toCovoiturageActions = (
  runToken: string
): readonly [NewActionDeReference, NewActionDeReference] => [
  {
    titre: withRunSuffix('Voie réservée au covoiturage', runToken),
    description: 'Réserver une voie aux véhicules à plusieurs occupants.',
    leviers: ['covoiturage'],
    categories: ['amenagement'],
  },
  {
    titre: withRunSuffix('Prime au covoiturage domicile-travail', runToken),
    description: 'Verser une prime aux salariés qui covoiturent.',
    leviers: ['covoiturage'],
    categories: ['financement'],
  },
];

const toBiogazAction = (runToken: string): NewActionDeReference => ({
  titre: withRunSuffix('Unité de méthanisation territoriale', runToken),
  description: 'Accompagner un projet de méthanisation agricole.',
  leviers: ['biogaz'],
  categories: ['gouvernance'],
});

test.describe('Priorisation : matrice et volet', () => {
  test('sans trajectoire SNBC, la vue invite à la calculer et mène à la page trajectoire', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.gotoWithoutTrajectoire(collectivite.data.id);
    await expect(pom.missingTrajectoireMessage).toBeVisible();
    await expect(pom.missingMobilisationMessage).toHaveCount(0);

    await pom.computeTrajectoireLink.click();

    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${collectivite.data.id}/trajectoire$`)
    );
  });

  test('une commune voit que la vue est réservée aux EPCI, sans invitation à calculer de trajectoire', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { type: 'commune' },
      userArgs: { autoLogin: true },
    });
    const pom = new PriorisationLeviersPom(page);

    await pom.gotoWithoutTrajectoire(collectivite.data.id);

    await expect(pom.reservedToEpciMessage).toBeVisible();
    await expect(pom.computeTrajectoireLink).toHaveCount(0);
  });

  test('sans potentiel de réduction connu, la page liste les 29 leviers hors matrice', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);

    await pom.goto(collectivite.data.id);

    await expect(pom.levierButtons).toHaveCount(29);
    await expect(pom.metricCount(/^actions? sauvegardées?$/)).toHaveText('0');
    await expect(pom.metricCount(/^leviers? à prioriser$/)).toHaveText('0');
    await expect(pom.preselectionLink).toHaveText(
      'Voir mes actions sauvegardées'
    );

    await pom.openPreselection();

    await expect(pom.emptyPreselectionMessage).toBeVisible();
    await expect(pom.mostImportantLevierLink).toHaveCount(0);
  });

  test("l'onglet « Classement » affiche l'histogramme des sous-leviers", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);

    await pom.sousLeviersTab.click();

    await expect(pom.sousLeviersCaption).toBeVisible();
  });

  test('le tableau des données du graphique se déplie et se replie', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
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
    await addMobilisationAvecFiche(collectivite.data.id);
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
    async ({ collectivites, page }) => {
      const levierSansAction: Levier =
        LEVIER_NOM_BY_ID.batiments_machines_agricoles;
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
      await addMobilisationAvecFiche(collectivite.data.id);
      const pom = new PriorisationLeviersPom(page);
      await pom.goto(collectivite.data.id);

      await pom.openLevier(levierSansAction);

      await expect(pom.noActionMessage(levierSansAction)).toBeVisible();
    }
  );

  test('le filtre par catégorie du volet ne garde que les actions de cette catégorie', async ({
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);

    await pom.chooseCategoriesInPanel(LEVIER_NOM, ['Financement & fiscalité']);

    await expect(
      pom.actionCardInPanel(LEVIER_NOM, financement.titre)
    ).toBeVisible();
    await expect(
      pom.actionCardInPanel(LEVIER_NOM, amenagement.titre)
    ).toBeHidden();
  });

  test('le filtre par catégories du volet garde les actions de chacune des catégories choisies', async ({
    collectivites,
    actionsDeReference,
    page,
  }) => {
    const runToken = crypto.randomUUID().slice(0, 8);
    const [amenagement, financement] = toCovoiturageActions(runToken);
    const gouvernance: NewActionDeReference = {
      titre: withRunSuffix('Charte de gouvernance du covoiturage', runToken),
      description: 'Réunir les acteurs autour d’une charte commune.',
      leviers: ['covoiturage'],
      categories: ['gouvernance'],
    };
    await actionsDeReference.add([amenagement, financement, gouvernance]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);

    await pom.chooseCategoriesInPanel(LEVIER_NOM, [
      'Aménagement & infrastructures',
      'Financement & fiscalité',
    ]);

    await expect(
      pom.actionCardInPanel(LEVIER_NOM, amenagement.titre)
    ).toBeVisible();
    await expect(
      pom.actionCardInPanel(LEVIER_NOM, financement.titre)
    ).toBeVisible();
    await expect(
      pom.actionCardInPanel(LEVIER_NOM, gouvernance.titre)
    ).toBeHidden();
    const shownActionsCount = await pom
      .levierPanel(LEVIER_NOM)
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { level: 2 }) })
      .count();
    await expect(pom.actionsTrouveesCount(LEVIER_NOM)).toHaveText(
      `${shownActionsCount} actions de référence trouvées`
    );
  });

  test("suggérer une action confirme l'envoi par un toast et laisse le formulaire remplissable", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    const panel = pom.levierPanel(LEVIER_NOM);
    await panel.getByRole('button', { name: 'Suggérer une action' }).click();
    const description = panel.getByRole('textbox', {
      name: "Décrivez l'action en quelques mots",
    });
    await description.fill('Une prime pour les covoitureurs');

    await panel.getByRole('button', { name: 'Envoyer' }).click();

    await expect(
      page.getByRole('status').filter({
        hasText: 'Merci, votre suggestion a bien été envoyée.',
      })
    ).toBeVisible();
    await expect(description).toBeVisible();
    await expect(description).toHaveValue('');
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    const card = pom.actionCardInPanel(LEVIER_NOM, amenagement.titre);

    await card.getByRole('button', { name: 'Sauvegarder' }).click();

    await expect(
      card.getByRole('button', { name: 'Sauvegardé' })
    ).toBeVisible();
    await expect(pom.metricCount(/^actions? sauvegardées?$/)).toHaveText('1');

    await page.reload();
    await expect(pom.title).toBeVisible();

    await expect(pom.metricCount(/^actions? sauvegardées?$/)).toHaveText('1');
    await pom.openPreselection();
    await expect(pom.preselectedCard(amenagement.titre)).toBeVisible();
  });

  test("« Pas intéressé » range l'action dans un accordéon, « Restaurer » la ressort", async ({
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
    await addMobilisationAvecFiche(collectivite.data.id);
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
      .getByRole('button', { name: 'Restaurer' })
      .click();

    await expect(accordion).toBeHidden();
    await expect(
      pom
        .actionCardInPanel(LEVIER_NOM, amenagement.titre)
        .getByRole('button', { name: 'Sauvegarder' })
    ).toBeVisible();
  });

  test('cliquer sur « Sauvegardé » sort une action de la présélection', async ({
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    await pom
      .actionCardInPanel(LEVIER_NOM, amenagement.titre)
      .getByRole('button', { name: 'Sauvegarder' })
      .click();
    await pom.openPreselection();
    await expect(pom.preselectedCard(amenagement.titre)).toBeVisible();

    await pom
      .preselectedCard(amenagement.titre)
      .getByRole('button', { name: 'Sauvegardé' })
      .click();

    await expect(pom.emptyPreselectionMessage).toBeVisible();
    await pom.backToPriorisation();
    await expect(pom.metricCount(/^actions? sauvegardées?$/)).toHaveText('0');
    await expect(pom.preselectionLink).toHaveText(
      'Voir mes actions sauvegardées'
    );
    await pom.openLevier(LEVIER_NOM);
    await expect(
      pom
        .actionCardInPanel(LEVIER_NOM, amenagement.titre)
        .getByRole('button', { name: 'Sauvegarder' })
    ).toBeVisible();
  });

  test('sauvegarder affiche un toast qui mène aux actions sauvegardées, retirer un toast qui permet d’annuler', async ({
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    const card = pom.actionCardInPanel(LEVIER_NOM, amenagement.titre);

    await card.getByRole('button', { name: 'Sauvegarder' }).click();

    const savedToast = page
      .getByRole('status')
      .filter({ hasText: /^Action sauvegardée/ });
    await expect(savedToast).toBeVisible();
    await savedToast
      .getByRole('button', { name: 'Voir mes actions sauvegardées' })
      .click();
    await expect(pom.preselectionTitle).toBeVisible();
    await expect(pom.preselectedCard(amenagement.titre)).toBeVisible();

    await pom.backToPriorisation();
    await pom.openLevier(LEVIER_NOM);
    await card.getByRole('button', { name: 'Sauvegardé' }).click();

    const removedToast = page
      .getByRole('status')
      .filter({ hasText: /^Action retirée de vos actions sauvegardées/ });
    await expect(removedToast).toBeVisible();
    await removedToast.getByRole('button', { name: 'Annuler' }).click();
    await expect(
      card.getByRole('button', { name: 'Sauvegardé' })
    ).toBeVisible();
  });

  test('« Afficher le levier le plus important » de la présélection vide ouvre ce levier dans la matrice', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.gotoWithLevierPotentiel({
      collectiviteId: collectivite.data.id,
      nom: LEVIER_TO_PRIORITIZE,
    });
    await pom.openPreselection();
    await expect(pom.emptyPreselectionMessage).toBeVisible();

    await pom.mostImportantLevierLink.click();

    await expect(pom.levierPanel(LEVIER_TO_PRIORITIZE)).toBeVisible();
    await expect(page).not.toHaveURL(/levier=/);
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
    await addMobilisationAvecFiche(collectivite.data.id);
    const pom = new PriorisationLeviersPom(page);
    await pom.goto(collectivite.data.id);
    await pom.openLevier(LEVIER_NOM);
    for (const action of [amenagement, financement]) {
      await pom
        .actionCardInPanel(LEVIER_NOM, action.titre)
        .getByRole('button', { name: 'Sauvegarder' })
        .click();
    }
    await pom.openLevier(AUTRE_LEVIER_NOM);
    await pom
      .actionCardInPanel(AUTRE_LEVIER_NOM, biogaz.titre)
      .getByRole('button', { name: 'Sauvegarder' })
      .click();
    await pom.openPreselection();
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
    await addMobilisationAvecFiche(collectivite.data.id);
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
      .getByRole('button', { name: 'Sauvegarder' })
      .click();
    await pom.openPreselection();
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
    await expect(pom.preselectionTitle).toBeVisible();
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
    await addMobilisationAvecFiche(collectivite.data.id);
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
      .getByRole('button', { name: 'Sauvegarder' })
      .click();
    await pom.openPreselection();

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
