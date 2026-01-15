import { test } from 'tests/main.fixture';

test.describe("Édition d'un plan d'action", () => {
  test("Éditer le nom d'un plan", async ({
    collectivites,
    plans,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNomInitial = 'Plan initial';
    const planNomModifie = 'Plan modifié';

    const planId = await plans.create(user, {
      nom: planNomInitial,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNomInitial);

    await editPlanPom.editPlanNom(planNomModifie);
    await editPlanPom.expectPlanTitle(planNomModifie);
  });

  test("Éditer le type d'un plan", async ({
    collectivites,
    plans,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec type modifiable';
    const planTypeInitial = 'Plan Climat Air Énergie Territorial';
    const planTypeModifie = 'Plan Eau';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);

    // Ajouter un type initial
    await editPlanPom.editPlanType(planTypeInitial);
    await editPlanPom.expectPlanType(planTypeInitial);

    // Modifier le type
    await editPlanPom.editPlanType(planTypeModifie);
    await editPlanPom.expectPlanType(planTypeModifie);
  });

  test("Éditer le nom et le type d'un plan", async ({
    collectivites,
    plans,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNomInitial = 'Plan initial';
    const planNomModifie = 'Plan modifié';
    const planType = 'Plan Climat Air Énergie Territorial';

    const planId = await plans.create(user, {
      nom: planNomInitial,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNomInitial);

    await editPlanPom.editPlanNom(planNomModifie);
    await editPlanPom.editPlanType(planType);
    await editPlanPom.expectPlanTitle(planNomModifie);
    await editPlanPom.expectPlanType(planType);
  });

  test('Ajouter une fiche action à un plan', async ({
    collectivites,
    plans,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fiches, // pour enregistrer le cleanup des fiches
    editPlanPom,
    ficheCardPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec fiche';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);

    await editPlanPom.addFiche();

    await ficheCardPom.expectSansTitre();
    await ficheCardPom.expectStatut('À venir');
  });

  test("Éditer le pilote et le référent d'un plan", async ({
    collectivites,
    plans,
    editPlanPom,
    personneTags,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec pilote et référent modifiables';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    const piloteTag = await personneTags.createPersonneTag({
      collectiviteId: collectivite.data.id,
      nom: 'Jean Dupont - Pilote',
    });

    const referentTag = await personneTags.createPersonneTag({
      collectiviteId: collectivite.data.id,
      nom: 'Marie Martin - Référente',
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);

    // Ajouter un pilote et un référent initiaux
    await editPlanPom.editPlanPilote(piloteTag.nom);
    await editPlanPom.editPlanReferent(referentTag.nom);
    await editPlanPom.expectPiloteExists(piloteTag.nom);
    await editPlanPom.expectReferentExists(referentTag.nom);
  });

  test("Ouvrir tous les axes/sous-axes d'un plan", async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec axes et sous-axes';
    const axe1Nom = 'Axe 1';
    const axe2Nom = 'Axe 2';
    const sousAxe1Nom = 'Sous-axe 1.1';
    const sousAxe2Nom = 'Sous-axe 1.2';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    // Créer deux axes de niveau 1
    const axe1Id = await plans.createAxe(user, {
      nom: axe1Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    await plans.createAxe(user, {
      nom: axe2Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    // Créer deux sous-axes sous l'axe 1
    await plans.createAxe(user, {
      nom: sousAxe1Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: axe1Id,
    });

    await plans.createAxe(user, {
      nom: sousAxe2Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: axe1Id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);

    // Vérifier que le bouton existe et affiche "Fermer" (tous les axes sont fermés, cliquer va les ouvrir)
    await editPlanPom.expectToggleAllAxesButtonShowsClose();

    // Vérifier que les axes sont fermés initialement
    await editAxePom.expectAxeIsClosed(axe1Nom);
    await editAxePom.expectAxeIsClosed(axe2Nom);

    // Cliquer sur le bouton pour ouvrir tous les axes
    await editPlanPom.toggleAllAxes();

    // Vérifier que le bouton affiche maintenant "Ouvrir" (tous les axes sont ouverts, cliquer va les fermer)
    await editPlanPom.expectToggleAllAxesButtonShowsOpen();

    // Vérifier que tous les axes sont maintenant ouverts
    await editAxePom.expectAxeIsOpen(axe1Nom);
    await editAxePom.expectAxeIsOpen(axe2Nom);

    // Vérifier que les sous-axes sont visibles (car leur parent est ouvert)
    await editAxePom.expectAxeIsVisible(sousAxe1Nom);
    await editAxePom.expectAxeIsVisible(sousAxe2Nom);
  });

  test("Fermer tous les axes/sous-axes d'un plan", async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec axes à fermer';
    const axe1Nom = 'Axe 1';
    const axe2Nom = 'Axe 2';
    const sousAxe1Nom = 'Sous-axe 1.1';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    // Créer deux axes de niveau 1
    const axe1Id = await plans.createAxe(user, {
      nom: axe1Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    await plans.createAxe(user, {
      nom: axe2Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    // Créer un sous-axe sous l'axe 1
    await plans.createAxe(user, {
      nom: sousAxe1Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: axe1Id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);

    // Ouvrir tous les axes d'abord
    await editPlanPom.toggleAllAxes();
    await editPlanPom.expectToggleAllAxesButtonShowsOpen();
    await editAxePom.expectAxeIsOpen(axe1Nom);
    await editAxePom.expectAxeIsOpen(axe2Nom);

    // Cliquer sur le bouton pour fermer tous les axes
    await editPlanPom.toggleAllAxes();

    // Vérifier que le bouton affiche maintenant "Fermer" (tous les axes sont fermés)
    await editPlanPom.expectToggleAllAxesButtonShowsClose();

    // Vérifier que tous les axes sont maintenant fermés
    await editAxePom.expectAxeIsClosed(axe1Nom);
    await editAxePom.expectAxeIsClosed(axe2Nom);
  });

  test("Basculer l'état d'ouverture/fermeture de tous les axes plusieurs fois", async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec basculement multiple';
    const axe1Nom = 'Axe 1';
    const axe2Nom = 'Axe 2';
    const sousAxe1Nom = 'Sous-axe 1.1';
    const sousAxe2Nom = 'Sous-axe 1.2';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    // Créer deux axes de niveau 1
    const axe1Id = await plans.createAxe(user, {
      nom: axe1Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    await plans.createAxe(user, {
      nom: axe2Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    // Créer deux sous-axes sous l'axe 1
    await plans.createAxe(user, {
      nom: sousAxe1Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: axe1Id,
    });

    await plans.createAxe(user, {
      nom: sousAxe2Nom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: axe1Id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);

    // État initial : tous fermés
    await editPlanPom.expectToggleAllAxesButtonShowsClose();
    await editAxePom.expectAxeIsClosed(axe1Nom);
    await editAxePom.expectAxeIsClosed(axe2Nom);

    // Première bascule : ouvrir tous
    await editPlanPom.toggleAllAxes();
    await editPlanPom.expectToggleAllAxesButtonShowsOpen();
    await editAxePom.expectAxeIsOpen(axe1Nom);
    await editAxePom.expectAxeIsOpen(axe2Nom);

    // Deuxième bascule : fermer tous
    await editPlanPom.toggleAllAxes();
    await editPlanPom.expectToggleAllAxesButtonShowsClose();
    await editAxePom.expectAxeIsClosed(axe1Nom);
    await editAxePom.expectAxeIsClosed(axe2Nom);

    // Troisième bascule : ouvrir tous à nouveau
    await editPlanPom.toggleAllAxes();
    await editPlanPom.expectToggleAllAxesButtonShowsOpen();
    await editAxePom.expectAxeIsOpen(axe1Nom);
    await editAxePom.expectAxeIsOpen(axe2Nom);
    await editAxePom.expectAxeIsVisible(sousAxe1Nom);
    await editAxePom.expectAxeIsVisible(sousAxe2Nom);
  });

  test("Modifier les options d'affichage d'un plan", async ({
    collectivites,
    plans,
    fiches,
    indicateurs,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = "Plan avec options d'affichage";
    const axeAvecDescription = 'Axe avec description';
    const axeAvecIndicateurs = 'Axe avec indicateurs';
    const axeAvecActionsNom = 'Axe avec actions';
    const description = "Description de test pour l'axe";
    const indicateurTitre = 'Indicateur de test';

    // Créer un plan
    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    // Créer un indicateur personnalisé
    const indicateurId = await indicateurs.create(user, {
      collectiviteId: collectivite.data.id,
      titre: indicateurTitre,
      unite: 'km',
    });

    // Créer les axes avec leurs contenus
    await plans.createAxe(user, {
      nom: axeAvecDescription,
      description,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    await plans.createAxe(user, {
      nom: axeAvecIndicateurs,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
      indicateurs: [{ id: indicateurId }],
    });

    const axeAvecActionsId = await plans.createAxe(user, {
      nom: axeAvecActionsNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });
    await fiches.create(user, [
      {
        collectiviteId: collectivite.data.id,
        titre: 'Fiche de test',
        axeId: axeAvecActionsId,
      },
    ]);

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);

    // Ouvrir les axes pour voir leur contenu
    await editPlanPom.toggleAllAxes();

    // Vérifier que les contenus sont présents
    await editAxePom.expectDescriptionContains(axeAvecDescription, description);
    await editAxePom.expectIndicateurLinkedToAxe(
      axeAvecIndicateurs,
      indicateurTitre
    );
    await editAxePom.expectIndicateursChartVisible(axeAvecIndicateurs);
    await editPlanPom.expectFicheExists('Fiche de test');

    // Vérifier que toutes les options sont cochées par défaut
    await editPlanPom.expectPlanDisplayOptionIsChecked('Description');
    await editPlanPom.expectPlanDisplayOptionIsChecked('Indicateurs');
    await editPlanPom.expectPlanDisplayOptionIsChecked(
      'Graphique des indicateurs'
    );
    await editPlanPom.expectPlanDisplayOptionIsChecked('Actions');

    // Vérifier que les sections sont visibles par défaut
    await editAxePom.expectDescriptionSectionVisible(
      axeAvecDescription,
      description
    );
    await editAxePom.expectIndicateursSectionVisible(axeAvecIndicateurs);
    await editAxePom.expectActionsSectionVisible(axeAvecActionsNom);
    await editAxePom.expectAxeMenuItemIsVisible(
      axeAvecIndicateurs,
      'Lier un indicateur'
    );
    await editAxePom.expectAxeMenuItemIsVisible(
      axeAvecDescription,
      'Supprimer la description'
    );

    // Désactiver l'option "Description"
    await editPlanPom.togglePlanDisplayOption('Description');
    await editPlanPom.expectPlanDisplayOptionIsUnchecked('Description');
    // Vérifier que la section Description n'est plus visible
    await editAxePom.expectDescriptionSectionNotVisible(
      axeAvecDescription,
      description
    );
    // Vérifier que l'option du menu n'est plus visible
    await editAxePom.expectAxeMenuItemIsNotVisible(
      axeAvecDescription,
      'Supprimer la description'
    );

    // Réactiver l'option "Description"
    await editPlanPom.togglePlanDisplayOption('Description');
    await editPlanPom.expectPlanDisplayOptionIsChecked('Description');
    // Vérifier que la section Description redevient visible
    await editAxePom.expectDescriptionSectionVisible(
      axeAvecDescription,
      description
    );
    await editAxePom.expectAxeMenuItemIsVisible(
      axeAvecDescription,
      'Supprimer la description'
    );

    // Désactiver l'option "Indicateurs"
    await editPlanPom.togglePlanDisplayOption('Indicateurs');
    await editPlanPom.expectPlanDisplayOptionIsUnchecked('Indicateurs');
    // Vérifier que "Graphique des indicateurs" reste cochée mais devient désactivée
    await editPlanPom.expectPlanDisplayOptionIsChecked(
      'Graphique des indicateurs'
    );
    await editPlanPom.expectPlanDisplayOptionIsDisabled(
      'Graphique des indicateurs'
    );
    // Vérifier que la section Indicateurs n'est plus visible
    await editAxePom.expectIndicateursSectionNotVisible(axeAvecIndicateurs);
    // Vérifier que l'option du menu n'est plus visible
    await editAxePom.expectAxeMenuItemIsNotVisible(
      axeAvecIndicateurs,
      'Lier un indicateur'
    );

    // Réactiver l'option "Indicateurs"
    await editPlanPom.togglePlanDisplayOption('Indicateurs');
    await editPlanPom.expectPlanDisplayOptionIsChecked('Indicateurs');
    // Vérifier que la section Indicateurs redevient visible
    await editAxePom.expectIndicateursSectionVisible(axeAvecIndicateurs);
    await editAxePom.expectAxeMenuItemIsVisible(
      axeAvecIndicateurs,
      'Lier un indicateur'
    );
    // Vérifier que "Graphique des indicateurs" redevient activable et reste cochée
    await editPlanPom.expectPlanDisplayOptionIsChecked(
      'Graphique des indicateurs'
    );

    // Désactiver "Graphique des indicateurs"
    await editPlanPom.togglePlanDisplayOption('Graphique des indicateurs');
    await editPlanPom.expectPlanDisplayOptionIsUnchecked(
      'Graphique des indicateurs'
    );
    // Vérifier que les indicateurs restent visibles mais sans graphique
    await editAxePom.expectIndicateursSectionVisible(axeAvecIndicateurs);
    await editAxePom.expectIndicateurLinkedToAxe(
      axeAvecIndicateurs,
      indicateurTitre
    );
    await editAxePom.expectIndicateursChartNotVisible(axeAvecIndicateurs);

    // Réactiver l'option
    await editPlanPom.togglePlanDisplayOption('Graphique des indicateurs');
    await editPlanPom.expectPlanDisplayOptionIsChecked(
      'Graphique des indicateurs'
    );
    // Vérifier que les indicateurs sont visibles et avec leur graphique
    await editAxePom.expectIndicateursSectionVisible(axeAvecIndicateurs);
    await editAxePom.expectIndicateurLinkedToAxe(
      axeAvecIndicateurs,
      indicateurTitre
    );
    await editAxePom.expectIndicateursChartVisible(axeAvecIndicateurs);

    // Désactiver l'option "Actions"
    await editPlanPom.togglePlanDisplayOption('Actions');
    await editPlanPom.expectPlanDisplayOptionIsUnchecked('Actions');
    // Vérifier que la section Actions n'est plus visible
    await editAxePom.expectActionsSectionNotVisible(axeAvecActionsNom);

    // Réactiver l'option "Actions"
    await editPlanPom.togglePlanDisplayOption('Actions');
    await editPlanPom.expectPlanDisplayOptionIsChecked('Actions');
    // Vérifier que la section Actions redevient visible
    await editAxePom.expectActionsSectionVisible(axeAvecActionsNom);
  });
});
