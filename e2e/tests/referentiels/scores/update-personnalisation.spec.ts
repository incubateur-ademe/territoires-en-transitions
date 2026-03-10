import { expect } from '@playwright/test';
import { PersonnalisationPom } from '../../collectivite/personnalisations/personnalisation.pom';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Update personnalisation', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await page.goto('/');
  });

  test('Recalcule du score potentiel après réponse aux questions', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.2 Planification sectorielle',
      '1.2.2 Organiser les mobilités sur le territoire'
    );

    await expect(
      referentielScoresPom.getActionPointsPotentielsLocator('1.2.2')
    ).toContainText('Potentiel : 12 points');

    // 1) Button CTA is present
    await expect(
      page.getByRole('link', { name: 'Répondre aux questions' })
    ).toBeVisible();

    // 2) Click CTA -> personalization page
    await page.getByRole('link', { name: 'Répondre aux questions' }).click();

    await expect(
      page.getByRole('heading', { name: 'Ma collectivité' })
    ).toBeVisible();

    // Mesure filtered by the action id (badge)
    await expect(
      page.getByText('1.2.2 - Organiser les mobilités sur le territoire')
    ).toBeVisible();

    const persoPom = new PersonnalisationPom(page);
    await persoPom.expectThematiquesVisible();

    // 3) Answer both binary questions to "Non"
    await persoPom.repondreQuestionBinaire('centre_urbain', 'Non');
    await persoPom.repondreQuestionBinaire('AOM_1', 'Non');

    // Wait for the backend listener to recompute the current snapshots.
    await page.waitForTimeout(1500);

    // 4) Go back to the action page
    await page.goBack();

    // 5) Potential is now reduced to 2 points
    await expect(
      referentielScoresPom.getActionPointsPotentielsLocator('1.2.2')
    ).toContainText('Potentiel réduit : 2 points');

    // CTA updated
    await expect(
      page.getByRole('link', { name: 'Voir les questions' })
    ).toBeVisible();
  });
});
