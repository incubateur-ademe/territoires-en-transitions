import { testWithPlans as test } from '../plans.fixture';

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
});
