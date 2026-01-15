import { mergeTests } from '@playwright/test';
import { testWithIndicateurs } from 'tests/indicateurs/indicateurs.fixture';
import { FicheCardPom } from '../fiches/list-fiches/fiche-card.pom';
import { testWithPlans } from '../plans/plans.fixture';

const test = mergeTests(testWithPlans, testWithIndicateurs);

test.describe("Édition d'axes dans un plan d'action", () => {
  test("Éditer le nom d'un axe", async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec axe';
    const axeNomInitial = 'Axe initial';
    const axeNomModifie = 'Axe modifié';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);

    // Créer un axe
    await editAxePom.addAxe(axeNomInitial);
    await editAxePom.expectAxeExists(axeNomInitial);

    // Éditer le nom de l'axe
    await editAxePom.editAxeNom(axeNomInitial, axeNomModifie);
    await editAxePom.expectAxeExists(axeNomModifie);
  });

  test("Éditer le nom d'un sous-axe", async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec sous-axe';
    const axeNom = 'Axe parent';
    const sousAxeNomInitial = 'Sous-axe initial';
    const sousAxeNomModifie = 'Sous-axe modifié';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);

    // Créer un axe parent
    await editAxePom.addAxe(axeNom);
    await editAxePom.expectAxeExists(axeNom);

    // Créer un sous-axe
    await editAxePom.addSousAxe(axeNom, sousAxeNomInitial);
    await editAxePom.expectAxeExists(sousAxeNomInitial);

    // Éditer le nom du sous-axe
    await editAxePom.editAxeNom(sousAxeNomInitial, sousAxeNomModifie);
    await editAxePom.expectAxeExists(sousAxeNomModifie);

    // Vérifier que le titre de l'axe parent n'a pas changé
    await editAxePom.expectAxeExists(axeNom);
  });

  test('Ajouter une fiche action à un axe', async ({
    collectivites,
    plans,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fiches, // requis pour enregistrer le cleanup des fiches
    editPlanPom,
    editAxePom,
    ficheCardPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec axe et fiche';
    const axeNom = 'Axe avec fiche';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);

    // Créer un axe
    await editAxePom.addAxe(axeNom);
    await editAxePom.expectAxeExists(axeNom);

    // Ajouter une fiche action dans l'axe spécifique
    await editAxePom.addFiche(axeNom);

    await ficheCardPom.expectSansTitre();
    await ficheCardPom.expectStatut('À venir');
  });

  test('Ajouter un indicateur à un axe', async ({
    collectivites,
    plans,
    indicateurs,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec axe et indicateur';
    const axeNom = 'Axe avec indicateur';
    const indicateurTitre1 = 'Indicateur de test 1';
    const indicateurTitre2 = 'Indicateur de test 2';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    // Créer deux indicateurs personnalisés
    await indicateurs.create(user, {
      collectiviteId: collectivite.data.id,
      titre: indicateurTitre1,
      unite: 'km',
    });
    await indicateurs.create(user, {
      collectiviteId: collectivite.data.id,
      titre: indicateurTitre2,
      unite: 'km',
    });

    await editPlanPom.goto(collectivite.data.id, planId);

    // Créer un axe
    await editAxePom.addAxe(axeNom);
    await editAxePom.expectAxeExists(axeNom);

    // Ouvrir le panneau pour lier un indicateur
    await editAxePom.openLinkIndicateurPanel(axeNom);

    // Filtrer pour afficher uniquement les indicateurs personnalisés
    await editAxePom.filterIndicateursPerso();

    // sélectionne les indicateurs dans le panneau latéral et vérifie leur présence dans la page
    await editAxePom.selectIndicateur(indicateurTitre1);
    await editAxePom.expectIndicateurLinkedToAxe(axeNom, indicateurTitre1);

    await editAxePom.selectIndicateur(indicateurTitre2);
    await editAxePom.expectIndicateurLinkedToAxe(axeNom, indicateurTitre2);

    // déselectionne le 1er et vérifie qu'il n'y a plus que le 2ème associé à l'axe
    await editAxePom.selectIndicateur(indicateurTitre1);
    await editAxePom.expectIndicateurLinkedToAxe(axeNom, indicateurTitre2);
    await editAxePom.expectIndicateurNotLinkedToAxe(axeNom, indicateurTitre1);
  });

  test('Ajouter une description à un axe', async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec axe et description';
    const axeNom = 'Axe avec description';
    const description = "Ceci est une description de test pour l'axe";

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);

    // Créer un axe
    await editAxePom.addAxe(axeNom);
    await editAxePom.expectAxeExists(axeNom);

    // Ajouter une description à l'axe
    await editAxePom.addDescriptionToAxe(axeNom);
    await editAxePom.expectDescriptionEditorVisible(axeNom);

    // Écrire la description
    await editAxePom.fillDescription(axeNom, description);

    // Vérifier que la description est sauvegardée
    await editAxePom.expectDescriptionContains(axeNom, description);

    // Supprimer la description
    await editAxePom.removeDescriptionFromAxe(axeNom);

    // Vérifier que la description n'apparaît plus
    await editAxePom.expectDescriptionNotVisible(axeNom);
  });

  test('Déplacer un axe vers un autre axe', async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = "Plan avec déplacement d'axe";
    const axeParentNom = 'Axe parent';
    const axeADeplacerNom = 'Axe à déplacer';

    // Crée le plan et deux axes au niveau racine
    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });
    await plans.createAxe(user, {
      nom: axeParentNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });
    await plans.createAxe(user, {
      nom: axeADeplacerNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editAxePom.expectAxeExists(axeParentNom);
    await editAxePom.expectAxeExists(axeADeplacerNom);

    // Déplacer l'axe sous l'axe parent
    await editAxePom.moveAxe(planNom, axeADeplacerNom, axeParentNom);

    // Vérifier que les axes existent toujours
    await editAxePom.expectAxeExists(axeParentNom);
    await editAxePom.expectAxeExists(axeADeplacerNom);

    // Vérifier que l'axe a bien été déplacé en tant que sous-axe
    await editAxePom.expectAxeIsSubAxeOf(axeADeplacerNom, axeParentNom);
  });

  test("Déplacer une fiche d'un axe vers un autre", async ({
    collectivites,
    plans,
    fiches,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec déplacement de fiche';
    const axeSourceNom = 'Axe source';
    const axeDestinationNom = 'Axe destination';
    const ficheTitre = 'Fiche à déplacer';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    // Créer deux axes au niveau racine
    const axeSourceId = await plans.createAxe(user, {
      nom: axeSourceNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });
    await plans.createAxe(user, {
      nom: axeDestinationNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    // Créer une fiche dans l'axe source
    await fiches.create(user, [
      {
        titre: ficheTitre,
        collectiviteId: collectivite.data.id,
        axeId: axeSourceId,
      },
    ]);

    await editPlanPom.goto(collectivite.data.id, planId);

    // Vérifier que la fiche est dans l'axe source
    await editAxePom.expectAxeExists(axeSourceNom);
    await editAxePom.expandAxe(axeSourceNom);
    const axeSource = editAxePom.getAxeByName(axeSourceNom);
    const ficheCardSource = new FicheCardPom({
      page: editPlanPom.page,
      axeParent: axeSource,
      ficheTitre,
    });
    await ficheCardSource.expectVisible();

    // Déplacer la fiche vers l'axe destination
    await ficheCardSource.moveFicheToAxe(planNom, axeDestinationNom);

    // Vérifier que la fiche n'est plus dans l'axe source
    await editAxePom.expandAxe(axeSourceNom);
    await ficheCardSource.expectHidden();

    // Vérifier que la fiche est maintenant dans l'axe destination
    await editAxePom.expectAxeExists(axeDestinationNom);
    const axeDestination = editAxePom.getAxeByName(axeDestinationNom);
    const ficheCardDestination = new FicheCardPom({
      page: editPlanPom.page,
      axeParent: axeDestination,
      ficheTitre,
    });
    await ficheCardDestination.expectVisible();
  });

  test("Déplacer une fiche d'un axe vers la racine du plan", async ({
    collectivites,
    plans,

    fiches, // requis pour enregistrer le cleanup des fiches
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec déplacement vers racine';
    const axeNom = 'Axe source';
    const ficheTitre = 'Fiche à déplacer vers racine';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    // Créer un axe au niveau racine
    const axeId = await plans.createAxe(user, {
      nom: axeNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    // Créer une fiche dans l'axe
    await fiches.create(user, [
      {
        titre: ficheTitre,
        collectiviteId: collectivite.data.id,
        axeId: axeId,
      },
    ]);

    await editPlanPom.goto(collectivite.data.id, planId);

    // Vérifier que la fiche est dans l'axe
    await editAxePom.expectAxeExists(axeNom);
    await editAxePom.expandAxe(axeNom);
    const axeParent = editAxePom.getAxeByName(axeNom);
    const ficheCardAxe = new FicheCardPom({
      page: editPlanPom.page,
      axeParent,
      ficheTitre,
    });
    await ficheCardAxe.expectVisible();

    // Déplacer la fiche vers la racine du plan (sans spécifier d'axe)
    await ficheCardAxe.moveFicheToAxe(planNom);

    // Vérifier que la fiche n'est plus dans l'axe source
    await editAxePom.expandAxe(axeNom);
    await ficheCardAxe.expectHidden();

    // Vérifier que la fiche est maintenant à la racine du plan
    const ficheCardPlan = new FicheCardPom({
      page: editPlanPom.page,
      ficheTitre,
    });
    await ficheCardPlan.expectVisible();
  });
});
