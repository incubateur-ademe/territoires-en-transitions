import { expect } from '@playwright/test';
import { PersonnalisationPom } from '../../collectivite/personnalisations/personnalisation.pom';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Hide desactivated action', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true, population: 10000 },
    });
    await page.goto('/');
  });

  test('Sous-mesure 3.1.2.2 is hidden when fournisseur_energie is NON', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable in order to clean data
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '3 - Approvisionnement énergie, eau, assainissement',
      "3.1 Organisation de la distribution d'énergie et services associés",
      '3.1.2 Inciter à la réduction des consommations et à l\u2019achat d\u2019électricité verte avec les fournisseurs et syndicats d\u2019énergie'
    );

    // Sous-mesure 3.1.2.2 should initially be visible
    await expect(
      page.locator('[data-test="SousActionHeader-3.1.2.2"]')
    ).toBeVisible();

    // Go to personalization page
    await page.getByRole('link', { name: 'Répondre aux questions' }).click();

    // Answer fournisseur_energie = Non
    const persoPom = new PersonnalisationPom(page);
    await persoPom.expectThematiquesVisible();
    await persoPom.openThematique('Énergie');
    await persoPom.repondreQuestionBinaire('fournisseur_energie', 'Non');

    // Wait for the backend listener to recompute the current snapshots.
    await page.waitForTimeout(1500);

    // Go back to the action page
    await page.goBack();

    await expect(
      page.locator('[data-test="SousActionHeader-3.1.2.1"]')
    ).toBeVisible();

    // Sous-mesure 3.1.2.2 should now be hidden
    await expect(
      page.locator('[data-test="SousActionHeader-3.1.2.2"]')
    ).toHaveCount(0);
  });

  test('Tâche 1.1.2.0.1 is hidden for EPCI with population < 20000', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable in order to clean data
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification territoriale',
      '1.1 Stratégie globale climat-air-énergie',
      '1.1.2 Réaliser le diagnostic Climat-Air-Énergie du territoire'
    );

    // Expand sous-action 1.1.2.0 to see tâches
    await referentielScoresPom.expandSousAction('1.1.2.0');

    // Tâche 1.1.2.0.1 should be hidden (desactivated for EPCI < 20000)
    await expect(page.locator('[data-test="Tache-1.1.2.0.1"]')).toHaveCount(0);
  });

  test('Action ECI 2.2 is hidden when dechets_1 is NON', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable in order to clean data
  }) => {
    await referentielScoresPom.goto('eci');
    await referentielScoresPom.goToActionPage(
      '2 - Développement des services de réduction, collecte et valorisation des déchets',
      null,
      "2.2 Améliorer l'efficience du système de collecte"
    );

    // Go to personalization page
    await page.getByRole('link', { name: 'Répondre aux questions' }).click();

    // Answer dechets_1 = Non
    const persoPom = new PersonnalisationPom(page);
    await persoPom.expectThematiquesVisible();
    await persoPom.openThematique('Déchets');
    await persoPom.repondreQuestionBinaire('dechets_1', 'Non');

    // Wait for the backend listener to recompute the current snapshots
    await page.waitForTimeout(1500);

    // Go back to the referentiel overview
    await referentielScoresPom.goto('eci');

    // Expand Axe 2
    await referentielScoresPom.expandAxe(
      '2 - Développement des services de réduction, collecte et valorisation des déchets'
    );

    // Action 2.2 should now be hidden (ActionCard returns null when desactive)
    await expect(
      referentielScoresPom.getActionCardLocator(
        "2.2 Améliorer l'efficience du système de collecte"
      )
    ).toHaveCount(0);

    // Navigate to action 2.1 to verify "Mesure suivante" skips 2.2
    await referentielScoresPom.goToActionPage(
      '2 - Développement des services de réduction, collecte et valorisation des déchets',
      null,
      "2.1 Disposer d'un programme de prévention des déchets",
      true
    );

    const nextLink = page.getByRole('link', { name: 'Mesure suivante' });
    await expect(nextLink).toBeVisible();
    await expect(nextLink).toHaveAttribute('href', /eci_2\.3/);
    await nextLink.click();
    await expect(
      page.getByRole('heading', {
        name: '2.3 Améliorer la valorisation des déchets (dont organiques)',
      })
    ).toBeVisible();

    // Navigate to action 2.3 to verify "Mesure précédente" skips 2.2
    await referentielScoresPom.goto('eci');
    await referentielScoresPom.goToActionPage(
      '2 - Développement des services de réduction, collecte et valorisation des déchets',
      null,
      '2.3 Améliorer la valorisation des déchets (dont organiques)'
    );

    const prevLink = page.getByRole('link', { name: 'Mesure précédente' });
    await expect(prevLink).toBeVisible();
    await expect(prevLink).toHaveAttribute('href', /eci_2\.1/);
    await prevLink.click();
    await expect(
      page.getByRole('heading', {
        name: "2.1 Disposer d'un programme de prévention des déchets",
      })
    ).toBeVisible();
  });
});
