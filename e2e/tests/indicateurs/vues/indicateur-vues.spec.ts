import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { IndicateurVuesPom } from './indicateur-vues.pom';

const SOLAIRE = 'Vue e2e énergie solaire';
const EAU = 'Vue e2e eau potable';

test.describe('Vues personnalisées des indicateurs', () => {
  test.setTimeout(120_000);

  test('crée, renomme, enregistre explicitement, réinitialise et supprime une vue', async ({
    page,
    collectivites,
    indicateurs,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const solaireId = await indicateurs.create(user, {
      collectiviteId,
      titre: SOLAIRE,
      unite: 'MWh',
    });
    const eauId = await indicateurs.create(user, {
      collectiviteId,
      titre: EAU,
      unite: 'm³',
    });
    const api = user.getTrpcClient().indicateurs.vues;
    const pom = new IndicateurVuesPom(page);

    const vue =
      await test.step('Créer une vue à partir de la recherche et la retrouver après rechargement', async () => {
        await pom.goto(collectiviteId);
        await expect(pom.createButton).toHaveCount(0);
        await pom.filterByText(SOLAIRE);
        await expect(pom.createButton).toHaveText('Sauvegarder cette vue');
        await expect(pom.saveMenuButton).toHaveCount(0);
        await expect(page.getByTestId(`chart-${solaireId}`)).toBeVisible();
        await expect(page.getByTestId(`chart-${eauId}`)).toHaveCount(0);
        await pom.openFilters();
        await expect(
          page.getByText('1 indicateur', { exact: true })
        ).toHaveCount(1);
        await expect(
          page.getByRole('button', { name: 'Réinitialiser les filtres' })
        ).toHaveCount(0);
        await expect(pom.openData).toBeVisible();
        await expect(
          pom.filterPanel.getByRole('button', {
            name: /Sauvegarder|Enregistrer les modifications/,
          })
        ).toHaveCount(0);
        await pom.closeFilters();
        await pom.createButton.click();
        await pom.submitName('Énergie à suivre');
        expect(new URL(page.url()).searchParams.get('$g')).toBe('false');

        const vues = await api.list.query({ collectiviteId });
        expect(vues).toHaveLength(1);
        expect(vues[0].filtres).toEqual({ text: SOLAIRE });
        await expect(pom.tab('Énergie à suivre')).toHaveAttribute(
          'href',
          `/collectivite/${collectiviteId}/indicateurs/liste/vue/${vues[0].id}`
        );

        await page.reload();
        await expect(pom.search).toHaveValue(SOLAIRE);
        await expect(page.getByTestId(`chart-${solaireId}`)).toBeVisible();
        return vues[0];
      });

    await test.step('Renommer conserve la vue et ses filtres', async () => {
      await pom.rename('Suivi du territoire');
      await expect(pom.tab('Énergie à suivre')).toHaveCount(0);
      await expect(pom.tab('Suivi du territoire')).toHaveAttribute(
        'href',
        `/collectivite/${collectiviteId}/indicateurs/liste/vue/${vue.id}`
      );
      expect(await api.list.query({ collectiviteId })).toMatchObject([
        { id: vue.id, nom: 'Suivi du territoire', filtres: { text: SOLAIRE } },
      ]);
    });

    await test.step('Modifier la recherche attend un enregistrement explicite', async () => {
      await pom.filterByText(EAU);
      await expect(page.getByTestId(`chart-${eauId}`)).toBeVisible();
      await expect(page.getByTestId(`chart-${solaireId}`)).toHaveCount(0);
      await expect(page.getByTestId('indicateurs.vues.save')).toBeEnabled();
      await expect(pom.createButton).toHaveCount(0);
      await pom.openSaveMenu();
      await expect(pom.saveAsNewButton).toBeEnabled();
      await pom.saveMenuButton.click();
      await expect(pom.status).toHaveText('Non enregistré');
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get('filter') === JSON.stringify({ text: EAU })
      );
      expect(await api.list.query({ collectiviteId })).toMatchObject([
        { id: vue.id, filtres: { text: SOLAIRE } },
      ]);

      const matchingVue = await api.create.mutate({
        collectiviteId,
        nom: 'Eau de référence',
        filtres: { text: EAU },
      });
      await page.reload();
      await expect(pom.tab('Eau de référence')).toBeVisible();
      await expect(pom.tab('Suivi du territoire')).toHaveAttribute(
        'aria-selected',
        'true'
      );
      // Reloading keeps the URL consultation without changing the saved vue.
      await expect(pom.search).toHaveValue(EAU);
      await expect(pom.status).toHaveText('Non enregistré');
      await expect(page.getByTestId(`chart-${eauId}`)).toBeVisible();
      await pom.openVueFilters();
      await expect(page.getByTestId('indicateurs.vues.save')).toBeEnabled();
      await pom.closeFilters();
      await pom.openSaveMenu();
      await expect(pom.saveAsNewButton).toBeEnabled();
      await pom.saveAsNewButton.click();
      await expect(pom.nameInput).toHaveValue('');
      await pom.cancelName();

      // Even when another vue has the exact same criteria, saving targets
      // the open vue and leaves the matching vue untouched.
      await pom.saveFilters();
      await expect(pom.nameInput).toHaveValue('Suivi du territoire');
      // Dismissing the optional rename leaves the new filters saved.
      await pom.cancelName();
      await expect(pom.status).toHaveText('Enregistré');
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get('filter') === JSON.stringify({ text: EAU })
      );
      await expect(pom.search).toHaveValue(EAU);
      const savedVues = await api.list.query({ collectiviteId });
      expect(savedVues).toHaveLength(2);
      expect(savedVues.find((item) => item.id === vue.id)).toMatchObject({
        id: vue.id,
        nom: 'Suivi du territoire',
        filtres: { text: EAU },
      });
      expect(savedVues.find((item) => item.id === matchingVue.id)).toEqual(
        matchingVue
      );
      await expect(pom.tab('Suivi du territoire')).toHaveAttribute(
        'aria-selected',
        'true'
      );

      await api.delete.mutate({ collectiviteId, id: matchingVue.id });
      await page.reload();
      await expect(page.getByTestId('indicateurs.vues.tab')).toHaveCount(1);
      await expect(pom.search).toHaveValue(EAU);
    });

    await test.step('Réinitialiser ne sauvegarde rien et rouvrir la vue restaure ses critères', async () => {
      await page
        .getByRole('button', { name: 'Supprimer tous les filtres' })
        .click();
      await expect(pom.search).toHaveValue('');
      await expect(page.getByTestId('indicateurs.vues.save')).toBeEnabled();
      await pom.openSaveMenu();
      await expect(pom.saveAsNewButton).toBeDisabled();
      await pom.saveMenuButton.click();
      await expect(page).toHaveURL(
        (url) => url.searchParams.get('filter') === '{}'
      );
      await page.reload();
      await expect(pom.search).toHaveValue('');
      await pom.openFilters();
      expect(await api.list.query({ collectiviteId })).toMatchObject([
        { id: vue.id, filtres: { text: EAU } },
      ]);
      await pom.closeFilters();
      await pom.tab('Suivi du territoire').click();
      await expect(pom.search).toHaveValue(EAU);
      await expect(page.getByTestId(`chart-${eauId}`)).toBeVisible();
    });

    await test.step('Enregistrer après réinitialisation conserve une vue sans critère', async () => {
      await page
        .getByRole('button', { name: 'Supprimer tous les filtres' })
        .click();
      await pom.saveFilters();
      await pom.submitName('Suivi du territoire');
      const vues = await api.list.query({ collectiviteId });
      expect(vues).toHaveLength(1);
      expect(vues[0]).toMatchObject({ id: vue.id, nom: 'Suivi du territoire' });
      expect(vues[0].filtres).toEqual({});
      await page.reload();
      await expect(pom.search).toHaveValue('');
    });

    await test.step('Supprimer retire la vue et revient à la liste', async () => {
      await pom.openFilters();
      await expect(page.getByTestId('indicateurs.vues.save')).toHaveCount(0);
      await pom.closeFilters();
      await pom.openVueActions();
      await page.getByTestId('indicateurs.vues.delete').click();
      await page.getByTestId('indicateurs.vues.confirm-delete').click();
      await expect(page).toHaveURL(/\/indicateurs\/liste\/tous(?:\?|$)/);
      await expect(page.getByTestId('indicateurs.vues.tab')).toHaveCount(0);
      expect(await api.list.query({ collectiviteId })).toEqual([]);
    });
  });

  test('partage la vue entre rédacteurs et réserve les mutations aux membres en écriture', async ({
    page,
    collectivites,
  }) => {
    const { collectivite, user: author } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const collectiviteId = collectivite.data.id;
    const vue = await author.getTrpcClient().indicateurs.vues.create.mutate({
      collectiviteId,
      nom: 'Vue partagée',
      filtres: { text: SOLAIRE, estFavori: true },
    });
    const editor = await collectivite.addUser({
      role: 'edition',
      autoLogin: true,
    });
    const pom = new IndicateurVuesPom(page);

    await pom.goto(collectiviteId, vue.id);
    await expect(pom.tab('Vue partagée')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(pom.search).toHaveValue(SOLAIRE);
    await pom.rename('Vue renommée par un autre membre');
    expect(
      await editor
        .getTrpcClient()
        .indicateurs.vues.list.query({ collectiviteId })
    ).toMatchObject([
      {
        id: vue.id,
        nom: 'Vue renommée par un autre membre',
        filtres: { text: SOLAIRE, estFavori: true },
        createdBy: author.data.id,
        modifiedBy: editor.data.id,
      },
    ]);

    // Saved criteria inherited from fixed tabs remain visible and removable.
    const favoriBadge = page.getByText('Favori', { exact: true });
    await expect(favoriBadge).toBeVisible();
    await favoriBadge.locator('..').getByRole('button').click();
    await expect(favoriBadge).toHaveCount(0);
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get('filter') === JSON.stringify({ text: SOLAIRE })
    );
    await page.reload();
    await expect(favoriBadge).toHaveCount(0);
    expect(
      await editor
        .getTrpcClient()
        .indicateurs.vues.list.query({ collectiviteId })
    ).toMatchObject([
      { id: vue.id, filtres: { text: SOLAIRE, estFavori: true } },
    ]);

    const reader = await collectivite.addUser({
      role: 'lecture',
      autoLogin: true,
    });
    await pom.goto(collectiviteId, vue.id);
    await expect(pom.tab('Vue renommée par un autre membre')).toBeVisible();
    await expect(pom.vueActions).toHaveCount(0);
    await expect(pom.search).toHaveValue(SOLAIRE);
    await pom.openFilters();
    await expect(page.getByTestId('indicateurs.vues.create')).toHaveCount(0);
    await expect(page.getByTestId('indicateurs.vues.save')).toHaveCount(0);
    await expect(pom.saveMenuButton).toHaveCount(0);
    await expect(page.getByTestId('indicateurs.vues.delete')).toHaveCount(0);

    await pom.closeFilters();
    await page
      .getByRole('button', { name: 'Supprimer tous les filtres' })
      .click();
    await pom.openFilters();
    await expect(pom.search).toHaveValue('');
    await expect(pom.status).toHaveText('Non enregistré');
    await expect(page.getByTestId('indicateurs.vues.save')).toHaveCount(0);
    expect(
      await reader
        .getTrpcClient()
        .indicateurs.vues.list.query({ collectiviteId })
    ).toMatchObject([
      { id: vue.id, filtres: { text: SOLAIRE, estFavori: true } },
    ]);
  });

  test('masque les actions sans modification et conserve la création pour les filtres déjà enregistrés', async ({
    page,
    collectivites,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const api = user.getTrpcClient().indicateurs.vues;
    const vue = await api.create.mutate({
      collectiviteId,
      nom: 'Énergie',
      filtres: { text: SOLAIRE },
    });
    const existingEau = await api.create.mutate({
      collectiviteId,
      nom: 'Eau de référence',
      filtres: { text: EAU },
    });
    const pom = new IndicateurVuesPom(page);
    await pom.goto(collectiviteId, vue.id);
    await pom.openFilters();
    await expect(
      page.getByRole('button', { name: 'Modifier le titre', exact: true })
    ).toHaveCount(0);
    await expect(page.getByTestId('indicateurs.vues.save')).toHaveCount(0);
    await expect(page.getByTestId('indicateurs.vues.create')).toHaveCount(0);
    await pom.openData.check();
    await expect(page).toHaveURL(
      (url) =>
        JSON.parse(url.searchParams.get('filter') ?? '{}').hasOpenData === true
    );
    await expect(page.getByTestId('indicateurs.vues.save')).toBeEnabled();
    expect(await api.list.query({ collectiviteId })).toEqual([
      vue,
      existingEau,
    ]);
    await pom.openData.uncheck();
    await expect(
      page.getByRole('button', { name: 'Modifier le titre', exact: true })
    ).toHaveCount(0);
    await expect(page.getByTestId('indicateurs.vues.save')).toHaveCount(0);
    await expect(page.getByTestId('indicateurs.vues.create')).toHaveCount(0);
    await expect(page).toHaveURL(
      (url) =>
        !('hasOpenData' in JSON.parse(url.searchParams.get('filter') ?? '{}'))
    );
    await pom.closeFilters();
    await pom.rename('Énergie renommée');

    await pom.filterByText(EAU);
    await expect(page.getByTestId('indicateurs.vues.save')).toBeEnabled();
    await expect(pom.createButton).toHaveCount(0);
    await pom.openSaveMenu();
    await pom.saveAsNewButton.click();
    await expect(pom.nameInput).toBeVisible();
    await pom.submitName('Eau');
    expect(await api.list.query({ collectiviteId })).toEqual([
      expect.objectContaining({
        id: vue.id,
        nom: 'Énergie renommée',
        filtres: { text: SOLAIRE },
      }),
      existingEau,
      expect.objectContaining({ nom: 'Eau', filtres: { text: EAU } }),
    ]);

    // Matching several saved vues from a fixed tab still creates a new vue.
    const savedVues = await api.list.query({ collectiviteId });
    await pom.goto(collectiviteId);
    await pom.filterByText(EAU);
    await pom.createButton.click();
    await expect(pom.nameInput).toHaveValue('');
    await pom.submitName('Autre sélection eau');
    expect(await api.list.query({ collectiviteId })).toEqual([
      ...savedVues,
      expect.objectContaining({
        nom: 'Autre sélection eau',
        filtres: { text: EAU },
      }),
    ]);
  });

  test('affiche les menus des vues inactives et applique les actions à la bonne vue', async ({
    page,
    collectivites,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const api = user.getTrpcClient().indicateurs.vues;
    await api.create.mutate({
      collectiviteId,
      nom: 'Énergie',
      filtres: { text: SOLAIRE },
    });
    const second = await api.create.mutate({
      collectiviteId,
      nom: 'Eau',
      filtres: { text: EAU },
    });
    const pom = new IndicateurVuesPom(page);

    await pom.goto(collectiviteId);
    await expect(pom.vueActions).toHaveCount(2);
    for (const nom of ['Énergie', 'Eau']) {
      await expect(
        pom.tab(nom).locator('..').getByTestId('indicateurs.vues.actions')
      ).toBeVisible();
    }

    await pom.tab('Énergie').click();
    await expect(pom.search).toHaveValue(SOLAIRE);
    await pom.openVueActions('Eau');
    await expect(pom.tab('Énergie')).toHaveAttribute('aria-selected', 'true');
    await page
      .getByRole('button', { name: 'Modifier le titre', exact: true })
      .click();
    await pom.nameInput.fill('Eau renommée');
    await page.getByTestId('indicateurs.vues.submit').click();
    await expect(pom.nameInput).toBeHidden();
    await expect(pom.tab('Eau renommée')).toBeVisible();
    await expect(pom.tab('Énergie')).toHaveAttribute('aria-selected', 'true');
    await expect(pom.search).toHaveValue(SOLAIRE);

    await pom.openVueActions('Eau renommée');
    await page
      .getByRole('button', { name: 'Modifier les filtres', exact: true })
      .click();
    await expect(page).toHaveURL((url) =>
      url.pathname.endsWith(`/vue/${second.id}`)
    );
    await expect(pom.search).toHaveValue(EAU);
    await expect(pom.openData).toBeVisible();
    await pom.closeFilters();

    await pom.openVueActions('Énergie');
    await page.getByTestId('indicateurs.vues.delete').click();
    await page.getByTestId('indicateurs.vues.confirm-delete').click();
    await expect(pom.tab('Énergie')).toHaveCount(0);
    await expect(pom.tab('Eau renommée')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(pom.search).toHaveValue(EAU);
    expect(await api.list.query({ collectiviteId })).toEqual([
      expect.objectContaining({ id: second.id, nom: 'Eau renommée' }),
    ]);

    await pom.openVueActions();
    await page.getByTestId('indicateurs.vues.delete').click();
    await page.getByTestId('indicateurs.vues.confirm-delete').click();
    await expect(page).toHaveURL(/\/indicateurs\/liste\/tous(?:\?|$)/);
    await expect(pom.vueActions).toHaveCount(0);
    expect(await api.list.query({ collectiviteId })).toEqual([]);
  });

  test('changer ou rouvrir un onglet abandonne la recherche encore en attente', async ({
    page,
    collectivites,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const api = user.getTrpcClient().indicateurs.vues;
    const first = await api.create.mutate({
      collectiviteId,
      nom: 'Énergie',
      filtres: { text: SOLAIRE },
    });
    const second = await api.create.mutate({
      collectiviteId,
      nom: 'Eau',
      filtres: { text: EAU },
    });
    const pom = new IndicateurVuesPom(page);
    await pom.goto(collectiviteId, first.id);
    await expect(pom.search).toHaveValue(SOLAIRE);

    // Blur must not queue an URL update that cancels the tab navigation.
    await pom.search.fill('Recherche avant changement de vue');
    await pom.tab('Eau').click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname.endsWith(`/vue/${second.id}`) &&
        !url.searchParams.has('filter')
    );
    await expect(pom.search).toHaveValue(EAU);

    // The same tab also restores its criteria when its text has not changed.
    await pom.search.fill('Recherche avant réouverture de la vue');
    await pom.tab('Eau').click();
    await expect(pom.search).toHaveValue(EAU);
    expect(new URL(page.url()).searchParams.has('filter')).toBe(false);
    expect(await api.list.query({ collectiviteId })).toEqual([first, second]);
  });
});
