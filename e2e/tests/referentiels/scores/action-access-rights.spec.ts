import { expect } from '@playwright/test';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from '../../collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const REFERENTIEL = 'cae';
const AXE = '1 - Planification';
const SOUS_AXE = '1.1 Stratégie globale';
const ACTION = '1.1.1 Définir la vision, les';

test.describe("Droits d'accès sur la page action", () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test('Éditeur voit le sélecteur de statut des sous-actions', async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto(REFERENTIEL);
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);

    await expect(
      referentielScoresPom.getSousActionAvancementSelectLocator('1.1.1.1')
    ).toBeVisible();
  });

  test("Éditeur ne voit pas les notes d'audit", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto(REFERENTIEL);
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);

    await expect(page.getByText("Notes de l'auditeur, auditrice")).toHaveCount(
      0
    );
  });

  test('Lecteur ne voit pas le sélecteur de statut', async ({
    page,
    referentielScoresPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto(REFERENTIEL);
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);

    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    await collectivite.setUserCollectiviteRole(CollectiviteRole.LECTURE);
    await page.reload();

    await expect(
      referentielScoresPom.getSousActionAvancementSelectLocator('1.1.1.1')
    ).toHaveCount(0);
  });

  test("Lecteur ne voit pas les notes d'audit", async ({
    page,
    referentielScoresPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto(REFERENTIEL);
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);

    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    await collectivite.setUserCollectiviteRole(CollectiviteRole.LECTURE);
    await page.reload();

    await expect(page.getByText("Notes de l'auditeur, auditrice")).toHaveCount(
      0
    );
  });

  test("Visiteur ne voit pas le sélecteur de statut ni les notes d'audit", async ({
    page,
    referentielScoresPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const firstCollectivite = collectivites.getCollectivite();

    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await page.goto(
      `/collectivite/${firstCollectivite.data.id}/referentiel/${REFERENTIEL}/action/cae_1.1.1`
    );

    await expect(
      referentielScoresPom.getSousActionAvancementSelectLocator('1.1.1.1')
    ).toHaveCount(0);

    await expect(page.getByText("Notes de l'auditeur, auditrice")).toHaveCount(
      0
    );
  });
});

test.describe("Notes d'audit - accès auditeur", () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test("L'auditeur voit les notes d'audit et peut les modifier", async ({
    page,
    referentielScoresPom,
    referentiels,
    collectivites,
  }) => {
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    const editeurUser = collectivite.getUser();

    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      editeurUser,
      collectivite.data.id,
      REFERENTIEL
    );

    await referentiels.requestCotAudit(
      editeurUser,
      collectivite.data.id,
      REFERENTIEL
    );

    const auditeurUser = await collectivite.addUser({
      autoLogin: true,
      role: CollectiviteRole.LECTURE,
    });

    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId: collectivite.data.id,
      referentielId: REFERENTIEL,
    });

    await referentiels.startAudit(
      auditeurUser,
      collectivite.data.id,
      REFERENTIEL
    );

    await page.reload();
    await referentielScoresPom.goto(REFERENTIEL);
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);

    await expect(
      page.getByText("Notes de l'auditeur, auditrice")
    ).toBeVisible();

    const notesEditor = page
      .getByText("Notes de l'auditeur, auditrice")
      .locator('xpath=../..')
      .locator('[contenteditable="true"]');
    await expect(notesEditor).toBeVisible();
  });

  test("L'éditeur ne voit pas les notes d'audit même pendant un audit", async ({
    page,
    referentielScoresPom,
    referentiels,
    collectivites,
  }) => {
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    const editeurUser = collectivite.getUser();

    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      editeurUser,
      collectivite.data.id,
      REFERENTIEL
    );

    await referentiels.requestCotAudit(
      editeurUser,
      collectivite.data.id,
      REFERENTIEL
    );

    const auditeurUser = await collectivite.addUser({
      autoLogin: true,
      role: CollectiviteRole.LECTURE,
    });

    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId: collectivite.data.id,
      referentielId: REFERENTIEL,
    });

    await referentiels.startAudit(
      auditeurUser,
      collectivite.data.id,
      REFERENTIEL
    );

    await editeurUser.login();
    await referentielScoresPom.goto(REFERENTIEL);
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);

    await expect(page.getByText("Notes de l'auditeur, auditrice")).toHaveCount(
      0
    );
  });
});
