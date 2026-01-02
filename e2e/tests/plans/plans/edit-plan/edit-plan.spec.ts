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
});
