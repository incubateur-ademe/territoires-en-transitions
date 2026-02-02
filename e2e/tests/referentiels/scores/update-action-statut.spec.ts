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
    page.goto('/');
  });

  test("Possible de mettre à jour le statut d'une action en tant qu'éditeur si on est pas en audit", async ({
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

  test("Impossible de mettre à jour le statut d'une action en tant que lecteur", async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
    collectivites,
  }) => {
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();
    await collectivite.setUserCollectiviteRole(CollectiviteRole.LECTURE);

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

    // Now we start the audit
    await referentiels.startAudit(
      auditeurUser,
      collectivite.data.id,
      referentiel
    );

    // Reload the page, we are now able to update the action statut because the audit is started
    await page.reload();
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
