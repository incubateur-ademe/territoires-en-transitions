import { expect } from '@playwright/test';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe("Modale de saisie des données d'indicateur du score indicatif", () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test("Cliquer sur \"Renseigner les données de l'indicateur\" ouvre la modale", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '4 - Mobilité',
      '4.1 Promotion et suivi de la mobilité',
      '4.1.1 Promouvoir et suivre les pratiques'
    );

    // La tâche 4.1.1.6.2 est à l'intérieur de la sous-action 4.1.1.6
    // qu'il faut déplier pour accéder aux tâches
    await referentielScoresPom.expandSousAction('4.1.1.6');

    const tache = page.locator(
      referentielScoresPom.getTacheLocationExpression('4.1.1.6.2')
    );
    const renseignerButton = tache.getByRole('button', {
      name: "Renseigner les données de l'indicateur",
    });

    await expect(renseignerButton).toBeVisible();

    // Aucune modale ouverte avant le clic
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await renseignerButton.click();

    // La modale doit s'ouvrir après le clic
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
