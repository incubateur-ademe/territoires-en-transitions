import { testWithPlans as test } from '../plans.fixture';

test.describe("Édition d'axes dans un plan d'action", () => {
  test("Éditer le nom d'un axe", async ({
    collectivites,
    plans,
    editPlanPom,
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
    await editPlanPom.addAxe(axeNomInitial);
    await editPlanPom.expectAxeExists(axeNomInitial);

    // Éditer le nom de l'axe
    await editPlanPom.editAxeNom(axeNomInitial, axeNomModifie);
    await editPlanPom.expectAxeExists(axeNomModifie);
  });

  test("Éditer le nom d'un sous-axe", async ({
    collectivites,
    plans,
    editPlanPom,
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
    await editPlanPom.addAxe(axeNom);
    await editPlanPom.expectAxeExists(axeNom);

    // Créer un sous-axe
    await editPlanPom.addSousAxe(axeNom, sousAxeNomInitial);
    await editPlanPom.expectAxeExists(sousAxeNomInitial);

    // Éditer le nom du sous-axe
    await editPlanPom.editAxeNom(sousAxeNomInitial, sousAxeNomModifie);
    await editPlanPom.expectAxeExists(sousAxeNomModifie);

    // Vérifier que le titre de l'axe parent n'a pas changé
    await editPlanPom.expectAxeExists(axeNom);
  });

  test('Ajouter une fiche action à un axe', async ({
    collectivites,
    plans,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fiches, // requis pour enregistrer le cleanup des fiches
    editPlanPom,
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
    await editPlanPom.addAxe(axeNom);
    await editPlanPom.expectAxeExists(axeNom);

    // Ajouter une fiche action dans l'axe spécifique
    await editPlanPom.addFiche(axeNom);

    await ficheCardPom.expectSansTitre();
    await ficheCardPom.expectStatut('À venir');
  });
});

