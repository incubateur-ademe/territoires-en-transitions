import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from '../../collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Update action statut', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await page.goto('/');
  });

  test("Possible de mettre à jour le statut d'une sous-action en tant qu'éditeur si on est pas en audit", async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.expectScoreRatio('cae', '1.1.1.1', 0, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0, 12);

    await referentielScoresPom.updateSousActionAvancement('1.1.1.1', 'fait');
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1.1', 0.6, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0.6, 12);
  });

  test("Possible de mettre à jour le statut d'une sous-action (avec tâches) détaillé au pourcentage en tant qu'éditeur si on est pas en audit", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const actionId = '1.1.1.1';
    await referentielScoresPom.expectScoreRatio('cae', actionId, 0, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0, 12);

    await referentielScoresPom.updateSousActionAvancement(actionId, 'detaille');
    await expect(
      referentielScoresPom.detaillerAvancementModalTitle
    ).toBeVisible();
    await expect(
      referentielScoresPom.detaillerAvancementPourcentageCheckbox
    ).toBeVisible();
    await referentielScoresPom.detaillerAvancementPourcentageCheckbox.check();

    await expect(referentielScoresPom.detaillerAvancementSlider).toBeVisible();
    await expect(
      referentielScoresPom.detaillerAvancementSliderMinValue
    ).toBeVisible();
    await expect(
      referentielScoresPom.detaillerAvancementSliderMaxValue
    ).toBeVisible();
    await referentielScoresPom.setDetaillerAvancementSliderMinValue(25);

    // If we cancel the modal, the score should not be updated
    await page.getByRole('button', { name: 'Annuler' }).click();
    await referentielScoresPom.expectScoreRatio('cae', actionId, 0, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0, 12);

    // Do the same thing but this time we validate the modal
    // As we have cancelled the modal
    await referentielScoresPom.updateSousActionAvancement(actionId, 'detaille');
    await referentielScoresPom.detaillerAvancementPourcentageCheckbox.check();
    await referentielScoresPom.setDetaillerAvancementSliderMinValue(25);
    await page.getByRole('button', { name: 'Valider' }).click();
    await referentielScoresPom.expectScoreRatio('cae', actionId, 0.2, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0.2, 12);
  });

  test("Possible de mettre à jour le statut d'une sous-action (sans tâches) détaillé au pourcentage en tant qu'éditeur si on est pas en audit", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
  }) => {
    const actionId = '1.1.1.5';
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.expectScoreRatio('cae', actionId, 0, 3.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0, 12);

    await referentielScoresPom.updateSousActionAvancement(actionId, 'detaille');
    await expect(
      referentielScoresPom.detaillerAvancementModalTitle
    ).toBeVisible();
    // no checkbox in this case because there is no tasks
    await expect(
      referentielScoresPom.detaillerAvancementPourcentageCheckbox
    ).toHaveCount(0);

    await expect(referentielScoresPom.detaillerAvancementSlider).toBeVisible();
    await expect(
      referentielScoresPom.detaillerAvancementSliderMinValue
    ).toBeVisible();
    await expect(
      referentielScoresPom.detaillerAvancementSliderMaxValue
    ).toBeVisible();
    await referentielScoresPom.setDetaillerAvancementSliderMinValue(25);

    // If we cancel the modal, the score should not be updated
    await page.getByRole('button', { name: 'Annuler' }).click();
    await referentielScoresPom.expectScoreRatio('cae', actionId, 0, 3.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0, 12);

    // Do the same thing but this time we validate the modal
    // As we have cancelled the modal
    await referentielScoresPom.updateSousActionAvancement(actionId, 'detaille');
    await referentielScoresPom.setDetaillerAvancementSliderMinValue(25);
    await page.getByRole('button', { name: 'Valider' }).click();
    await referentielScoresPom.expectScoreRatio('cae', actionId, 0.9, 3.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0.9, 12);
  });

  test("Possible de mettre à jour le statut d'une tâche en tant qu'éditeur si on est pas en audit, doit mettre à jour le statut de la sous-action", async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.expectScoreRatio('cae', '1.1.1.1', 0, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0, 12);

    await referentielScoresPom.expandSousAction('1.1.1.1');
    await referentielScoresPom.updateTacheAvancement('1.1.1.1.1', 'fait');
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1.1', 0.3, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0.3, 12);
  });

  test("Impossible de mettre à jour le statut d'une action en tant que lecteur", async ({
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

    await expect(
      referentielScoresPom.getSousActionAvancementSelectLocator('1.1.1.1')
    ).toHaveCount(0);

    await expect(
      referentielScoresPom.getSousActionAvancementBadgeLocator('1.1.1.1')
    ).toBeVisible();
  });

  test("Impossible de mettre à jour le statut d'une action en tant que visiteur", async ({
    referentielScoresPom,
    page,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
    collectivites,
  }) => {
    const firstCollectivite: CollectiviteFixture =
      collectivites.getCollectivite();
    await referentielScoresPom.goto('cae');

    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    // Reload the page, we are now a visitor
    await page.reload();
    await expect(
      page.getByRole('button', { name: `${firstCollectivite.data.nom} visite` })
    ).toBeVisible();
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await expect(
      referentielScoresPom.getSousActionAvancementSelectLocator('1.1.1.1')
    ).toHaveCount(0);

    await expect(
      referentielScoresPom.getSousActionAvancementBadgeLocator('1.1.1.1')
    ).toBeVisible();
  });

  test("Une fois l'audit démarré, seul l'auditeur peut mettre à jour le statut des actions", async ({
    referentielScoresPom,
    labellisationPom,
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
    await expect(
      referentielScoresPom.getSousActionAvancementSelectLocator('1.1.1.1')
    ).toHaveCount(0);

    await expect(
      referentielScoresPom.getSousActionAvancementBadgeLocator('1.1.1.1')
    ).toBeVisible();

    // Start the audit
    await labellisationPom.goto(referentiel);
    await expect(labellisationPom.startLabellisationAuditButton).toBeEnabled();
    await labellisationPom.startLabellisationAuditButton.click();
    await expect(labellisationPom.suiviLabellisationAuditTab).toBeVisible();

    // We are now able to update the action statut because the audit is started
    await referentielScoresPom.goto(referentiel);
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );
    await referentielScoresPom.updateSousActionAvancement('1.1.1.1', 'fait');
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1.1', 0.6, 0.6);
    await referentielScoresPom.expectScoreRatio('cae', '1.1.1', 0.6, 12);

    // But if we signin as the first editeur user, we are not able anymore
    await editeurUser.login();
    await page.reload();
    await expect(
      page.getByRole('link', { name: `${collectivite.data.nom} éditeur` })
    ).toBeVisible();
    await expect(
      referentielScoresPom.getSousActionAvancementSelectLocator('1.1.1.1')
    ).toHaveCount(0);
    await expect(
      referentielScoresPom.getSousActionAvancementBadgeLocator('1.1.1.1')
    ).toBeVisible();
  });
});
