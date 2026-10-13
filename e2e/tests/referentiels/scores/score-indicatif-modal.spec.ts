import { expect } from '@playwright/test';
import { UserFixture } from 'tests/users/users.fixture';
import { test } from 'tests/main.fixture';

test.describe("Modale de saisie des données d'indicateur du score indicatif", () => {
  let user: UserFixture;
  let collectiviteId: number;

  test.beforeEach(async ({ page, collectivites }) => {
    const created = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    user = created.user;
    collectiviteId = created.collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, 'cae');
    await page.goto('/');
  });

  test('Cliquer sur "Renseigner les données de l\'indicateur" ouvre la modale', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage('4.1.1');

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

  test('Afficher les années des observations historiques dans le score indicatif', async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const actionId = 'cae_4.1.1.6.2';
    const scores = await user
      .getTrpcClient()
      .referentiels.actions.getScoreIndicatif.query({
        collectiviteId,
        actionIds: [actionId],
      });
    const score = scores[actionId];
    expect(score.indicateurs.length).toBeGreaterThan(0);
    const { indicateurId, unite } = score.indicateurs[0];
    const valeur = {
      indicateurId,
      valeur: 0,
      dateValeur: '2025-07-10',
      sourceLibelle: 'CITEPA',
      sourceMetadonnee: null,
    };
    score.fait = { score: 0, valeursUtilisees: [valeur] };
    score.programme = {
      score: 0,
      valeursUtilisees: [{ ...valeur, dateValeur: '2030-12-31' }],
    };

    // Les écritures actuelles normalisent les dates au 1er janvier. Rejouer
    // une réponse historique permet de vérifier sa lecture dans le navigateur.
    await page.route(
      '**/trpc/referentiels.actions.getScoreIndicatif?**',
      async (route) => {
        await route.fulfill({ json: { result: { data: scores } } });
      }
    );
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage('4.1.1');
    await referentielScoresPom.expandSousAction('4.1.1.6');
    const tache = page.locator(
      referentielScoresPom.getTacheLocationExpression('4.1.1.6.2')
    );
    const fait = tache.getByText('Score indicatif Fait de', { exact: false });
    await expect(fait).toContainText(`0 ${unite}`);
    await expect(fait).toContainText('en 2025');
    await expect(fait).toContainText('(source : CITEPA)');
    const programme = tache.getByText('Score indicatif Fait en 2030', {
      exact: false,
    });
    await expect(programme).toContainText(`0 ${unite}`);
    await expect(programme).toContainText('atteint en 2030');
    await expect(programme).toContainText('(source : CITEPA)');

    await tache
      .getByRole('button', { name: "Modifier les données de l'indicateur" })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
  for (const buttonName of ['Valider', 'Valider et ajouter une année']) {
    test(`Conserver la saisie annuelle du score après un échec de ${buttonName}`, async ({
      page,
      referentielScoresPom,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      referentiels,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      indicateurs,
    }) => {
      await page.addLocatorHandler(
        page
          .getByRole('dialog')
          .filter({ hasText: 'Rattachez ProConnect à votre compte' }),
        async (dialog) => {
          await dialog.getByRole('button', { name: 'Plus tard' }).click();
        }
      );
      await referentielScoresPom.goto('cae');
      await referentielScoresPom.goToActionPage('4.1.1');
      await referentielScoresPom.expandSousAction('4.1.1.6');
      const tache = page.locator(
        referentielScoresPom.getTacheLocationExpression('4.1.1.6.2')
      );
      await tache
        .getByRole('button', { name: "Renseigner les données de l'indicateur" })
        .click();
      const scoreDialog = page.getByRole('dialog');
      await scoreDialog
        .getByRole('button', { name: 'ouvrir le menu' })
        .filter({ hasText: 'Sélectionnez la source à utiliser' })
        .first()
        .click();
      await page
        .getByRole('button', {
          name: 'Résultats de la collectivité',
          exact: true,
        })
        .click();
      await scoreDialog
        .getByRole('button', { name: 'ouvrir le menu' })
        .filter({ hasText: 'Sélectionnez une année' })
        .first()
        .click();
      await page
        .getByRole('button', { name: 'Ajouter une année', exact: true })
        .click();
      const editor = page.getByRole('dialog', {
        name: 'Ajouter une année',
        exact: true,
      });
      const year = editor.getByRole('textbox', {
        name: 'Année *',
        exact: true,
      });
      const resultat = editor.getByRole('textbox', {
        name: 'Résultat',
        exact: true,
      });
      await year.fill('2026');
      await resultat.fill('0');
      const upsertUrl = /indicateurs\.valeurs\.upsert/;
      await page.route(upsertUrl, (route) => route.abort('failed'));
      const failedRequest = page.waitForEvent('requestfailed', (request) =>
        upsertUrl.test(request.url())
      );
      await editor
        .getByRole('button', { name: buttonName, exact: true })
        .click();
      await failedRequest;
      await expect(editor).toBeVisible();
      await expect(year).toHaveValue('2026');
      await expect(resultat).toHaveValue('0');
      const retry = editor.getByRole('button', {
        name: 'Valider',
        exact: true,
      });
      await expect(retry).toBeEnabled();
      await page.unroute(upsertUrl);
      const savedResponse = page.waitForResponse(
        (response) => upsertUrl.test(response.url()) && response.ok()
      );
      await retry.click();
      const saved = await (await savedResponse).json();
      try {
        expect(saved.result.data).toMatchObject({
          dateValeur: '2026-01-01',
          resultat: 0,
        });
        await expect(editor).toHaveCount(0);
      } finally {
        await user.getTrpcClient().indicateurs.valeurs.delete.mutate({
          collectiviteId,
          indicateurId: saved.result.data.indicateurId,
          id: saved.result.data.id,
        });
      }
    });
  }
});
