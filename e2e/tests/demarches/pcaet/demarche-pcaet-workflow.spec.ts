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

    await demarchePcaetPom.gotoCreatePage(collectivite.data.id);
    await demarchePcaetPom.createDemarche(collectivite.data.id);
    await demarchePcaetPom.expectCreatePlanCta();

    // Le type PCAET est pré-sélectionné dans la modale, et le plan créé est
    // rattaché automatiquement à la démarche.
    const planNom = 'PCAET créé depuis la démarche';
    await demarchePcaetPom.createPlanFromModal(
      planNom,
      'Plan Climat Air Énergie Territorial'
    );
    await demarchePcaetPom.expectLinkedPlanHeader(planNom);
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
    await demarchePcaetPom.expectNoTopicGridRow(
      'Chauffage / Logement collectif'
    );
    await demarchePcaetPom.expectNoTopicGridRow('Autres industries');
  });

  test('la barre d’étapes traverse documents, topics du diagnostic et plan', async ({
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

    // Attend que la cible du bouton « suivante » soit recalculée avant de
    // cliquer : le href se met à jour après le changement de ?topic=.
    const clickNextTo = async (hrefPattern: RegExp) => {
      await expect(demarchePcaetPom.stepsNavNext).toHaveAttribute(
        'href',
        hrefPattern
      );
      await demarchePcaetPom.stepsNavNext.click();
    };

    // Premier item du parcours : pas de « précédente », le panneau est fermé.
    await expect(page).toHaveURL(/\/documents\/?$/);
    await demarchePcaetPom.closeProgressPanel();
    await expect(demarchePcaetPom.stepsNavPrevious).toBeHidden();

    // Franchir une sous-étape ouvre le panneau d'avancée automatiquement.
    await clickNextTo(/topic=profil_energie_climat$/);
    await expect(page).toHaveURL(/\/indicateurs\?topic=profil_energie_climat$/);
    await demarchePcaetPom.expectActiveTopic('profil_energie_climat');
    await demarchePcaetPom.expectProgressPanelOpen(true);

    // Naviguer entre topics ne touche pas au panneau. Le parcours suit l'ordre
    // d'affichage du référentiel : aucun volet ne s'y saute.
    await demarchePcaetPom.closeProgressPanel();
    await clickNextTo(/topic=polluants_atmospheriques$/);
    await expect(page).toHaveURL(/\?topic=polluants_atmospheriques$/);
    await demarchePcaetPom.expectActiveTopic('polluants_atmospheriques');
    await clickNextTo(/topic=sequestration$/);
    await expect(page).toHaveURL(/\?topic=sequestration$/);
    await demarchePcaetPom.expectActiveTopic('sequestration');
    await demarchePcaetPom.expectProgressPanelOpen(false);

    await clickNextTo(/topic=consommation_energetique$/);
    await expect(page).toHaveURL(/\?topic=consommation_energetique$/);
    await demarchePcaetPom.expectActiveTopic('consommation_energetique');
    await clickNextTo(/topic=enr$/);
    await expect(page).toHaveURL(/\?topic=enr$/);
    await demarchePcaetPom.expectActiveTopic('enr');
    await clickNextTo(/topic=vulnerabilite_territoire$/);
    await expect(page).toHaveURL(/\?topic=vulnerabilite_territoire$/);
    await demarchePcaetPom.expectActiveTopic('vulnerabilite_territoire');
    await demarchePcaetPom.expectProgressPanelOpen(false);

    // Dernier topic → plan : nouveau franchissement, le panneau se rouvre.
    await clickNextTo(/\/plan$/);
    await expect(page).toHaveURL(/\/plan\/?$/);
    await demarchePcaetPom.expectProgressPanelOpen(true);

    // Dernier item : « suivante » devient la transmission, bloquée tant que le
    // dossier est incomplet (règle workflow évaluée côté serveur).
    await expect(demarchePcaetPom.stepsNavNext).toBeHidden();
    await expect(demarchePcaetPom.stepsNavTransmettre).toBeVisible();
    await expect(demarchePcaetPom.stepsNavTransmettre).toBeDisabled();

    // « Précédente » depuis le plan revient sur le dernier topic du diagnostic.
    await demarchePcaetPom.stepsNavPrevious.click();
    await expect(page).toHaveURL(/\?topic=vulnerabilite_territoire$/);
    await demarchePcaetPom.expectActiveTopic('vulnerabilite_territoire');
  });
});
