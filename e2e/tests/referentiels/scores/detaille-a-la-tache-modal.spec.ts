import { expect } from '@playwright/test';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Modale « détaillé à la tâche »', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test('depuis une sous-action au statut programme, la modale affiche les sélecteurs de statut des tâches', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.updateSousActionAvancement('1.1.1.1', 'programme');

    await referentielScoresPom.expandSousAction('1.1.1.1');
    await expect(
      referentielScoresPom.getTacheAvancementSelectLocator('1.1.1.1.1')
    ).toHaveCount(0);

    await referentielScoresPom.openDetailleALaTacheModal('1.1.1.1');

    const tacheStatutSelect =
      referentielScoresPom.getModalTacheAvancementSelectLocator('1.1.1.1.1');
    await expect(tacheStatutSelect).toBeVisible();

    await tacheStatutSelect.click();
    await expect(page.locator('[data-test="SelectStatut-options"]')).toBeVisible();
    await page.locator('[data-test="fait"]').click();

    await referentielScoresPom.closeDetailleALaTacheModal();

    await expect(
      referentielScoresPom.getSousActionAvancementBadgeLocator('1.1.1.1')
    ).toContainText('Détaillé à la tâche');
  });
});
