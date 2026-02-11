import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from '../../collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Update action commentaire', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await page.goto('/');
  });

  test("Possible de mettre à jour le commentaire d'une sous-action en tant qu'éditeur même si on est en audit", async ({
    referentielScoresPom,
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
    collectivites,
  }) => {
    const referentiel: ReferentielId = 'cae';
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    const editeurUser = collectivite.getUser();
    await referentiels.requestCotAudit(
      editeurUser,
      collectivite.data.id,
      referentiel
    );
    await referentielScoresPom.goto(referentiel);
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const actionCommentaireLocator =
      referentielScoresPom.getActionCommentaireLocator('cae_1.1.1.1');
    await expect(actionCommentaireLocator).toBeVisible();

    await actionCommentaireLocator.click();
    // Fill is not working for RichTextEditor
    await page.keyboard.type('Test commentaire');
    await page.keyboard.press('Enter');
    await expect(actionCommentaireLocator).toContainText('Test commentaire');

    // We need to update the action otherwise the test is not working
    // likely to be related to Rich Text Editor
    await referentielScoresPom.updateSousActionAvancement('1.1.1.1', 'fait');
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1.1', 0.6, 0.6);

    await page.reload();
    await expect(actionCommentaireLocator).toContainText('Test commentaire');
  });

  test("Impossible de mettre à jour le commentaire d'une action en tant que lecteur", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
    collectivites,
  }) => {
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    await collectivite.setUserCollectiviteRole(CollectiviteRole.LECTURE);

    await page.reload();
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const actionCommentaireLocator =
      referentielScoresPom.getActionCommentaireLocator('cae_1.1.1.1');
    await expect(actionCommentaireLocator).toBeVisible();

    await actionCommentaireLocator.click();
    // Fill is not working for RichTextEditor
    await page.keyboard.type('Test commentaire');
    await page.keyboard.press('Enter');
    await expect(actionCommentaireLocator).not.toContainText(
      'Test commentaire'
    );
  });

  test("Une fois l'audit démarré, l'auditeur peut mettre à jour le commentaire des actions", async ({
    referentielScoresPom,
    page,
    referentiels,
    collectivites,
  }) => {
    const referentiel: ReferentielId = 'cae';
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    const editeurUser = collectivite.getUser();
    await referentielScoresPom.goto(referentiel);
    await referentiels.requestCotAudit(
      editeurUser,
      collectivite.data.id,
      referentiel
    );

    const auditeurUser = await collectivite.addUser({
      autoLogin: true,
      accessLevel: CollectiviteRole.LECTURE,
    });

    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId: collectivite.data.id,
      referentielId: referentiel,
    });

    // Reload the page, we are now an auditeur
    await page.reload();
    await expect(
      page.getByRole('link', { name: `${collectivite.data.nom} audit` })
    ).toBeVisible();
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    // The audit is not started yet, so the auditeur cannot update the action statut
    const actionCommentaireLocator =
      referentielScoresPom.getActionCommentaireLocator('cae_1.1.1.1');
    await expect(actionCommentaireLocator).toBeVisible();

    await actionCommentaireLocator.click();
    // Fill is not working for RichTextEditor
    await page.keyboard.type('Test commentaire');
    await page.keyboard.press('Enter');
    await expect(actionCommentaireLocator).not.toContainText(
      'Test commentaire'
    );

    // Now we start the audit
    await referentiels.startAudit(
      auditeurUser,
      collectivite.data.id,
      referentiel
    );

    // Reload the page, we are now able to update the action commentaire because the audit is started
    await page.reload();
    await expect(actionCommentaireLocator).toBeVisible();

    await actionCommentaireLocator.click();
    // Fill is not working for RichTextEditor
    await page.keyboard.type('Test commentaire');
    await page.keyboard.press('Enter');
    await expect(actionCommentaireLocator).toContainText('Test commentaire');

    // We need to update the action otherwise the test is not working
    // likely to be related to Rich Text Editor
    await referentielScoresPom.updateSousActionAvancement('1.1.1.1', 'fait');
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1.1', 0.6, 0.6);

    await page.reload();
    await expect(actionCommentaireLocator).toContainText('Test commentaire');
  });
});
