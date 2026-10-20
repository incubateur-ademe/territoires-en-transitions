import { expect } from '@playwright/test';
import { testWithFiches as test } from 'tests/plans/fiches/fiches.fixture';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.sessionStorage.setItem('oidc-modal-seen', '1')
  );
});

test.describe('Saisie des notes de suivi', () => {
  test('saisit une nouvelle note après un seul clic et la conserve au rechargement', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });
    const [ficheId] = await fiches.create(user, [
      {
        titre: 'Fiche avec une nouvelle note de suivi',
        collectiviteId: collectivite.data.id,
      },
    ]);
    const trpcClient = user.getTrpcClient();

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/notes`
    );
    await page.getByRole('button', { name: 'Ajouter une note' }).click();

    const table = page.getByRole('table');
    // Attend la ligne persistée, après remplacement de la ligne optimiste.
    await expect(table.getByText(/^Créée par /)).toBeVisible();
    const editor = table.getByRole('textbox');
    await editor.click();
    await expect(editor).toBeFocused();
    await page.keyboard.type('Nouvelle note de suivi.');
    await expect(editor).toHaveText('Nouvelle note de suivi.');
    await page.getByRole('columnheader', { name: 'Description' }).click();

    await expect
      .poll(async () => {
        const fiche = await trpcClient.plans.fiches.get.query({ id: ficheId });
        return fiche.notes?.[0]?.note;
      })
      .toContain('Nouvelle note de suivi.');
    await page.reload();
    await expect(editor).toHaveText('Nouvelle note de suivi.');
  });

  test("conserve le curseur pendant la sauvegarde de l'année et enregistre la modification", async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });
    const [ficheId] = await fiches.create(user, [
      {
        titre: 'Fiche avec une note de suivi à modifier',
        collectiviteId: collectivite.data.id,
      },
    ]);
    const trpcClient = user.getTrpcClient();
    const year = new Date().getFullYear();
    await trpcClient.plans.fiches.update.mutate({
      ficheId,
      ficheFields: {
        notes: [
          { dateNote: `${year}-01-01`, note: '<p>Une note de suivi.</p>' },
        ],
      },
    });
    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/notes`
    );
    const table = page.getByRole('table');
    const editor = table.getByRole('textbox');
    await expect(editor).toHaveText('Une note de suivi.');

    // Retarde uniquement la réponse réelle : le rafraîchissement de la fiche
    // doit arriver pendant la saisie, sans dépendre de la vitesse du serveur.
    let releaseSave!: () => void;
    const saveReleased = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    const updateUrl = '**/trpc/plans.fiches.update*';
    await page.route(
      updateUrl,
      async (route) => {
        const response = await route.fetch();
        await saveReleased;
        await route.fulfill({ response });
      },
      { times: 1 }
    );

    try {
      await table
        .getByRole('cell', { name: String(year), exact: true })
        .click();
      const saveRequested = page.waitForRequest(updateUrl);
      await page
        .getByRole('button', { name: String(year - 1), exact: true })
        .click();
      await saveRequested;

      await editor.click();
      await page.keyboard.press('Home');
      await page.keyboard.type('B');
      await expect(editor).toHaveText('BUne note de suivi.');

      releaseSave();
      // Les métadonnées confirment que le résultat serveur a été affiché.
      await expect(table.getByText(/^Modifiée par /)).toBeVisible();
      await expect(editor).toBeFocused();
      await page.keyboard.type('onjour ');
      await expect(editor).toHaveText('Bonjour Une note de suivi.');
      await page.getByRole('columnheader', { name: 'Description' }).click();

      await expect
        .poll(async () => {
          const fiche = await trpcClient.plans.fiches.get.query({
            id: ficheId,
          });
          return fiche.notes?.[0]?.note;
        })
        .toContain('Bonjour Une note de suivi.');
      await page.reload();
      await expect(editor).toHaveText('Bonjour Une note de suivi.');
      await expect(
        table.getByRole('cell', { name: String(year - 1), exact: true })
      ).toBeVisible();
    } finally {
      releaseSave();
    }
  });
});
