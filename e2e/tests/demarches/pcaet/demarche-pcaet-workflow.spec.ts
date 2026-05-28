import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { DemarchePcaetPom } from './demarche-pcaet.pom';

test.describe('Démarche PCAET - workflow plan actions', () => {
  test('création de démarche sans plan PCAET existant', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    await demarchePcaetPom.goto(collectivite.data.id);
    await demarchePcaetPom.expectOnCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.expectCreatePlanCta(collectivite.data.id);
  });

  test('création de démarche puis rattachement manuel à un plan PCAET existant', async ({
    collectivites,
    createPlanPom,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    const planNom = 'PCAET existant à lier';
    await createPlanPom.goto(collectivite.data.id);
    await createPlanPom.fillNom(planNom);
    await createPlanPom.selectType('Plan Climat Air Énergie Territorial');
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);

    await demarchePcaetPom.goto(collectivite.data.id);
    await demarchePcaetPom.expectOnCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.expectPlanLinkingUi();
    await demarchePcaetPom.linkSelectedPlan();
    await demarchePcaetPom.expectLinkedPlanHeader(planNom);
  });
});

