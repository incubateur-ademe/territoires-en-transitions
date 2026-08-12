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

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
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

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.expectPlanLinkingUi();
    await demarchePcaetPom.linkSelectedPlan();
    await demarchePcaetPom.expectLinkedPlanHeader(planNom);
  });

  test('le diagnostic est servi par le référentiel en base', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const demarchePcaetPom = new DemarchePcaetPom(page);

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.gotoDiagnostic();
    await demarchePcaetPom.expectDiagnosticTopicsFromApi();

    // Le décret attend le secteur, pas sa décomposition : les huit secteurs du
    // profil sont là, et les sous-secteurs de la trajectoire SNBC n'y sont pas.
    for (const secteur of [
      'Résidentiel',
      'Tertiaire',
      'Transport routier',
      'Autres transports',
      'Agriculture',
      'Déchets',
      'Industrie hors branche énergie',
      'Branche énergie',
    ]) {
      await demarchePcaetPom.expectTopicGridRow(secteur);
    }
    await demarchePcaetPom.expectNoTopicGridRow('Chauffage / Logement collectif');
    await demarchePcaetPom.expectNoTopicGridRow('Autres industries');
  });
});
