import { testWithPlans as test } from '../plans.fixture';

test.describe("Création d'un plan d'action", () => {
  test('Créer un plan avec uniquement un nom', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // nécessaire pour que le cleanup soit bien enregistré
    createPlanPom,
    editPlanPom,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan de test';
    await createPlanPom.goto(collectivite.data.id);
    await createPlanPom.fillNom(planNom);
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);

    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectPlanIsEmpty();
  });

  test('Créer un plan avec un nom et un type', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // nécessaire pour que le cleanup soit bien enregistré
    createPlanPom,
    editPlanPom,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec type';
    const planType = 'Plan Climat Air Énergie Territorial';

    await createPlanPom.goto(collectivite.data.id);
    await createPlanPom.fillNom(planNom);
    await createPlanPom.typeSelect.isVisible();
    await createPlanPom.selectType(planType);
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);

    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectPlanType(planType);
    await editPlanPom.expectPlanIsEmpty();
  });

  test('Créer un plan et ajouter un axe', async ({
    collectivites,
    plans,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan créé via API';
    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectUrl(collectivite.data.id, planId);
    await editPlanPom.expectPlanIsEmpty();

    const axeNom = 'Axe de test';
    await editPlanPom.addAxe(axeNom);
    await editPlanPom.expectAxeExists(axeNom);
  });
});
