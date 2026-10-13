import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { DropdownPom } from 'tests/shared/dropdown.pom';
import { IndicateurValeursPom } from './indicateur-valeurs.pom';

test('Choisir un résultat ou un objectif et quitter le menu au clavier', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const indicateurId = await indicateurs.create(user, {
    collectiviteId: collectivite.data.id,
    titre: 'Choix des données au clavier',
    unite: '%',
  });
  for (const year of [2025, 2026]) {
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId: collectivite.data.id,
      indicateurId,
      periodicite: 'annuelle',
      dateValeur: `${year}-01-01`,
    });
  }
  await indicateurDetailPom.goto(collectivite.data.id, indicateurId);
  const valeurs = new IndicateurValeursPom(page);

  const firstAdd = valeurs.cell(2025).getByTestId('indicateurs.valeurs.add');
  const secondAdd = valeurs.cell(2026).getByTestId('indicateurs.valeurs.add');
  await firstAdd.focus();
  await page.keyboard.press('Tab');
  await expect(secondAdd).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(firstAdd).toBeFocused();
  await page.keyboard.press('Enter');
  const resultat = page.getByRole('button', { name: 'Résultat', exact: true });
  const objectif = page.getByRole('button', { name: 'Objectif', exact: true });
  await expect(resultat).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(objectif).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(resultat).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(objectif).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(resultat).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(firstAdd).toBeFocused();
  await expect(firstAdd).toHaveAttribute('aria-expanded', 'false');

  await page.keyboard.press('Enter');
  await expect(resultat).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(objectif).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(secondAdd).toBeFocused();
  await expect(firstAdd).toHaveAttribute('aria-expanded', 'false');

  await page.keyboard.press('Shift+Tab');
  await expect(firstAdd).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(resultat).toBeFocused();
  await page.keyboard.press('Enter');
  const resultatInput = valeurs.valueInput(2025, 'Résultat');
  await expect(resultatInput).toBeFocused();
  await resultatInput.fill('10');
  const resultatSaved = valeurs.waitForUpsertValeurResponse();
  await resultatInput.press('Enter');
  await resultatSaved;

  await secondAdd.focus();
  await page.keyboard.press('Space');
  await expect(resultat).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(objectif).toBeFocused();
  await page.keyboard.press('Enter');
  const objectifInput = valeurs.valueInput(2026, 'Objectif');
  await expect(objectifInput).toBeFocused();
  await objectifInput.fill('20');
  const objectifSaved = valeurs.waitForUpsertValeurResponse();
  await objectifInput.press('Enter');
  await objectifSaved;
  await page.reload();
  await expect(valeurs.valueButton(2025, 'Résultat')).toContainText('10');
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('20');
});

test('Signaler les colonnes masquées et masquer les commentaires vides en visite', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const indicateurId = await indicateurs.create(user, {
    collectiviteId: collectivite.data.id,
    titre: 'Tableau défilant',
    unite: '%',
  });
  for (let year = 2020; year <= 2026; year++) {
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId: collectivite.data.id,
      indicateurId,
      periodicite: 'annuelle',
      dateValeur: `${year}-01-01`,
      resultat: 10,
    });
  }
  await indicateurDetailPom.goto(collectivite.data.id, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  const addColumnCells = valeurs.table.locator('tr > :last-child');
  const shadowOpacities = () =>
    addColumnCells.evaluateAll((cells) =>
      cells.map((cell) => getComputedStyle(cell, '::before').opacity)
    );

  await expect(valeurs.table).toHaveAttribute('data-can-scroll-right', 'true');
  await expect.poll(shadowOpacities).toEqual(['1', '1', '1']);
  await expect(
    valeurs.deletePeriodeButton(2020).locator('.ri-delete-bin-6-line')
  ).toBeVisible();
  await valeurs.table.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect(valeurs.table).toHaveAttribute('data-can-scroll-right', 'false');
  await expect.poll(shadowOpacities).toEqual(['0', '0', '0']);
  await valeurs.table.evaluate((element) => {
    element.scrollLeft = 0;
  });
  await expect.poll(shadowOpacities).toEqual(['1', '1', '1']);

  await collectivite.addUser({ role: 'lecture', autoLogin: true });
  await page.reload();
  await expect(valeurs.cell(2020)).toContainText('10');
  await expect(valeurs.table.getByRole('row')).toHaveCount(2);
  await expect(valeurs.table.locator('tfoot')).toHaveCount(0);
  await expect(valeurs.table.getByRole('button')).toHaveCount(0);
});

test('Saisir résultat et objectif dans la même période annuelle', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const indicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Saisie annuelle',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await expect(valeurs.table).toBeVisible();
  await expect(valeurs.table.locator('td[data-periode]')).toHaveCount(0);

  await valeurs.addResultat(2026, 0);
  await valeurs.editValeur(2026, 'Objectif', '20,12345');
  await valeurs.addResultat(2025, 12);
  await page.reload();

  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('0');
  // La valeur relue respecte la précision de deux décimales de l’indicateur.
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('20,12');
  const sourceName = valeurs.table.getByRole('rowheader', {
    name: 'Données de la collectivité',
    exact: true,
  });
  await expect(sourceName).toBeVisible();
  await expect(sourceName.locator('[style*="background-color"]')).toHaveCount(
    0
  );
  await expect(sourceName).toHaveCSS('vertical-align', 'middle');
  const legend = valeurs.table.locator('..').getByRole('list');
  for (const container of [legend, valeurs.cell(2026)]) {
    await expect(container.getByText('R', { exact: true })).toHaveCSS(
      'color',
      'rgb(106, 106, 244)'
    );
    await expect(container.getByText('O', { exact: true })).toHaveCSS(
      'color',
      'rgb(245, 137, 91)'
    );
  }
  await expect(
    valeurs.table.locator('thead th').filter({ hasText: /^202/ })
  ).toHaveText([/^2025/, /^2026/]);
  await expect(
    page.getByRole('button', { name: 'Résultats', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Objectifs', exact: true })
  ).toHaveCount(0);

  const saved = await user.getTrpcClient().indicateurs.valeurs.list.query({
    collectiviteId,
    indicateurIds: [indicateurId],
    periodicite: 'annuelle',
  });
  expect(saved.indicateurs[0].sources.collectivite.valeurs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        dateValeur: '2026-01-01',
        periodicite: 'annuelle',
        resultat: 0,
        objectif: 20.12,
      }),
    ])
  );
});

test('Afficher les données non renseignées en lecture seule', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const emptyIndicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Indicateur sans données',
    unite: '%',
  });
  await indicateurs.addResultats(user, {
    collectiviteId,
    identifiantReferentiel: 'cae_8',
    valeurs: [
      { dateValeur: '2025-01-01', resultat: 10, sourceId: 'citepa' },
      { dateValeur: '2026-01-01', resultat: 0, sourceId: 'citepa' },
    ],
  });
  const { data: definitions } = await user
    .getTrpcClient()
    .indicateurs.indicateurs.list.query({
      collectiviteId,
      filters: { identifiantsReferentiel: ['cae_8'] },
    });
  await indicateurDetailPom.goto(collectiviteId, definitions[0].id);
  await collectivite.addUser({ role: 'lecture', autoLogin: true });
  await page.reload();
  const valeurs = new IndicateurValeursPom(page);
  await expect(
    valeurs.table.getByRole('rowheader', {
      name: 'Données de la collectivité',
      exact: true,
    })
  ).toBeVisible();
  for (const year of [2025, 2026]) {
    const missing = valeurs
      .cell(year)
      .getByText('Non renseigné', { exact: true });
    await expect(missing).toBeVisible();
    await expect(missing).not.toHaveClass(/sr-only/);
  }
  await expect(valeurs.cell(2026, 'citepa')).toHaveText('R0');
  await expect(valeurs.table.getByRole('button')).toHaveCount(0);
  await expect(valeurs.table.locator('tfoot')).toHaveCount(0);

  await page.goto(
    `/collectivite/${collectiviteId}/indicateurs/perso/${emptyIndicateurId}`
  );
  await expect(valeurs.table.getByRole('cell')).toHaveText('Non renseigné');
  await expect(valeurs.table.getByRole('button')).toHaveCount(0);
});

test('Proposer uniquement un objectif pour une année future', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-13T12:00:00+02:00'));
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const indicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Objectifs futurs',
    unite: '%',
  });
  // Les anciens résultats futurs restent consultables.
  for (const valeur of [
    { dateValeur: '2026-01-01' },
    { dateValeur: '2028-01-01', resultat: 0 },
  ]) {
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId,
      indicateurId,
      periodicite: 'annuelle',
      ...valeur,
    });
  }
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await valeurs.cell(2026).getByTestId('indicateurs.valeurs.add').click();
  await expect(
    page.getByRole('button', { name: 'Résultat', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Objectif', exact: true })
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await valeurs.ajouterAnneeInput.fill('2027');
  await valeurs.ajouterAnneeInput.press('Enter');
  await expect(valeurs.ajouterAnneeInput).toHaveValue('');
  await expect(valeurs.ajouterAnneeInput).toBeEnabled();
  await expect(valeurs.ajouterAnneeInput).toBeFocused();
  const addObjectif = valeurs.cell(2027).getByRole('button', {
    name: 'Ajouter un objectif — 2027',
    exact: true,
  });
  await expect(addObjectif).toHaveText('Ajouter un objectif');
  await expect(
    valeurs.cell(2027).getByTestId('indicateurs.valeurs.add')
  ).toHaveCount(0);
  await addObjectif.focus();
  await page.keyboard.press('Enter');
  const input = valeurs.valueInput(2027, 'Objectif');
  await expect(input).toBeFocused();
  await expect(valeurs.valueButton(2027, 'Résultat')).toHaveCount(0);
  await input.press('Escape');
  await expect(addObjectif).toBeVisible();
  await valeurs.editValeur(2027, 'Objectif', '0');
  await page.reload();
  await expect(valeurs.valueButton(2027, 'Objectif')).toContainText('0');
  await expect(valeurs.valueButton(2027, 'Résultat')).toHaveCount(0);
  await expect(
    valeurs.cell(2028).getByLabel('Résultat — 2028', { exact: true })
  ).toHaveText('R0');
  await expect(valeurs.valueButton(2028, 'Résultat')).toHaveCount(0);
  const saved = await user.getTrpcClient().indicateurs.valeurs.list.query({
    collectiviteId,
    indicateurIds: [indicateurId],
    periodicite: 'annuelle',
  });
  const futureValue = saved.indicateurs[0].sources.collectivite.valeurs.find(
    (value) => value.dateValeur === '2027-01-01'
  );
  expect(futureValue).toMatchObject({ objectif: 0 });
  expect(futureValue?.resultat).toBeUndefined();
  await valeurs.editValeur(2027, 'Objectif', '');
  await expect(addObjectif).toBeVisible();
  await expect(valeurs.valueButton(2027, 'Résultat')).toHaveCount(0);

  // La période devient courante : la saisie d'un résultat est alors disponible.
  await page.clock.setFixedTime(new Date('2027-01-01T12:00:00+01:00'));
  await page.reload();
  await valeurs.cell(2027).getByTestId('indicateurs.valeurs.add').click();
  await expect(
    page.getByRole('button', { name: 'Résultat', exact: true })
  ).toBeVisible();
});

test('Enregistrer les deux commentaires annuels et les consulter en lecture seule', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const indicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Commentaires annuels',
    unite: '%',
  });
  for (const valeur of [
    {
      dateValeur: '2025-01-01',
      resultatCommentaire: 'Commentaire sans valeur',
    },
    { dateValeur: '2026-01-01', resultat: 0, objectif: 20 },
    { dateValeur: '2027-01-01' },
  ]) {
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId,
      indicateurId,
      periodicite: 'annuelle',
      ...valeur,
    });
  }
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  const writes: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().includes('indicateurs.valeurs.upsert')
    ) {
      writes.push(request.url());
    }
  });

  await valeurs.commentaireButton(2026).click();
  const modal = page.getByRole('dialog', { name: 'Commentaires — 2026' });
  const input = modal.getByRole('textbox');
  await input.fill('Résultat mesuré');
  await modal.getByRole('tab', { name: 'Objectifs', exact: true }).click();
  await input.fill('Objectif adopté');
  await modal.getByRole('tab', { name: 'Résultats', exact: true }).click();
  await expect(input).toHaveValue('Résultat mesuré');
  await modal.getByRole('tab', { name: 'Objectifs', exact: true }).click();
  await expect(input).toHaveValue('Objectif adopté');
  expect(writes).toHaveLength(0);
  const saved = valeurs.waitForUpsertValeurResponse();
  await modal.getByRole('button', { name: 'Valider', exact: true }).click();
  await saved;
  await expect(modal).toBeHidden();
  expect(writes).toHaveLength(1);
  await page.reload();

  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('0');
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('20');
  await expect(valeurs.commentaireButton(2026)).toHaveText('2');
  await expect(valeurs.commentaireButton(2025)).toHaveText('1');
  await expect(valeurs.commentaireButton(2027)).toHaveText('');
  await expect(valeurs.table.locator('tfoot').getByRole('button')).toHaveCount(
    3
  );
  await expect(
    valeurs.table.locator('tbody').getByRole('button', { name: /Commentaires/ })
  ).toHaveCount(0);

  // Effacer un commentaire conserve celui de l'autre onglet et les valeurs.
  await valeurs.editCommentaire(2026, 'résultat', '');
  await expect(valeurs.commentaireButton(2026)).toHaveText('1');
  await collectivite.addUser({ role: 'lecture', autoLogin: true });
  await page.reload();
  await expect(valeurs.table).toBeVisible();
  await expect(valeurs.ajouterAnneeInput).toHaveCount(0);
  await expect(valeurs.deletePeriodeButton(2026)).toHaveCount(0);
  await expect(valeurs.valueButton(2026, 'Résultat')).toHaveCount(0);
  await expect(valeurs.valueButton(2026, 'Objectif')).toHaveCount(0);
  await expect(valeurs.commentaireButton(2027)).toHaveCount(0);

  await valeurs.commentaireButton(2026).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeDisabled();
  await modal.getByRole('tab', { name: 'Objectifs', exact: true }).click();
  await expect(input).toHaveValue('Objectif adopté');
  await expect(input).toBeDisabled();
  await expect(
    modal.getByRole('button', { name: 'Valider', exact: true })
  ).toHaveCount(0);
  await modal
    .getByRole('button', { name: 'Fermer', exact: true })
    .filter({ hasText: /^Fermer$/ })
    .click();

  await valeurs.commentaireButton(2025).click();
  const commentOnlyModal = page.getByRole('dialog', {
    name: 'Commentaires — 2025',
  });
  await expect(commentOnlyModal.getByRole('textbox')).toHaveValue(
    'Commentaire sans valeur'
  );
  await expect(commentOnlyModal.getByRole('textbox')).toBeDisabled();
});

test('Conserver les deux brouillons de commentaires après un échec et réessayer', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const indicateurId = await indicateurs.create(user, {
    collectiviteId: collectivite.data.id,
    titre: 'Nouvelle tentative des commentaires',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectivite.data.id, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await valeurs.addResultat(2026, 10);
  await valeurs.commentaireButton(2026).click();
  const modal = page.getByRole('dialog', { name: 'Commentaires — 2026' });
  const input = modal.getByRole('textbox');
  const validate = modal.getByRole('button', { name: 'Valider', exact: true });
  await input.fill('Résultat mesuré');
  await modal.getByRole('tab', { name: 'Objectifs', exact: true }).click();
  await input.fill('Objectif adopté');

  let releaseSave!: () => void;
  const pendingSave = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  await page.route(
    /indicateurs\.valeurs\.upsert/,
    async (route) => {
      await pendingSave;
      await route.abort('failed');
    },
    { times: 1 }
  );
  try {
    await validate.click();
    await expect(validate).toBeDisabled();
    await expect(input).toBeDisabled();
    await modal.getByRole('tab', { name: 'Résultats', exact: true }).click();
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue('Résultat mesuré');
  } finally {
    releaseSave();
  }
  await expect(validate).toBeEnabled();
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue('Résultat mesuré');
  await modal.getByRole('tab', { name: 'Objectifs', exact: true }).click();
  await expect(input).toHaveValue('Objectif adopté');

  const saved = valeurs.waitForUpsertValeurResponse();
  await validate.click();
  await saved;
  await expect(modal).toBeHidden();
  await page.reload();
  await expect(valeurs.commentaireButton(2026)).toHaveText('2');
  await valeurs.commentaireButton(2026).click();
  await expect(input).toHaveValue('Résultat mesuré');
  await modal.getByRole('tab', { name: 'Objectifs', exact: true }).click();
  await expect(input).toHaveValue('Objectif adopté');
});

test('Attendre la sauvegarde d’un objectif zéro et conserver sa saisie après un échec', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const indicateurId = await indicateurs.create(user, {
    collectiviteId: collectivite.data.id,
    titre: 'Nouvelle tentative de saisie annuelle',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectivite.data.id, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await valeurs.ajouterAnneeInput.fill('2026');
  await valeurs.ajouterAnneeInput.press('Enter');
  await valeurs.cell(2026).getByTestId('indicateurs.valeurs.add').click();
  await page.getByRole('button', { name: 'Objectif', exact: true }).click();
  const input = valeurs.valueInput(2026, 'Objectif');
  await input.fill('0');

  let releaseSave!: () => void;
  const pendingSave = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  await page.route(
    /indicateurs\.valeurs\.upsert/,
    async (route) => {
      await pendingSave;
      await route.abort('failed');
    },
    { times: 1 }
  );
  try {
    await input.press('Enter');
    await expect(input).toHaveAttribute('aria-busy', 'true');
    await expect(input).toHaveValue('0');
  } finally {
    releaseSave();
  }
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveValue('0');
  const saved = valeurs.waitForUpsertValeurResponse();
  // La nouvelle tentative fonctionne aussi en quittant le champ.
  await valeurs.ajouterAnneeInput.click();
  await saved;
  await expect(input).toHaveCount(0);
  await page.reload();
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('0');
});

test('Annuler une saisie et attendre la fin de la composition avant de sauvegarder', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const indicateurId = await indicateurs.create(user, {
    collectiviteId: collectivite.data.id,
    titre: 'Saisie au clavier',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectivite.data.id, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await valeurs.addResultat(2026, 0);
  const writes: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().includes('indicateurs.valeurs.upsert')
    ) {
      writes.push(request.url());
    }
  });

  await valeurs.valueButton(2026, 'Résultat').click();
  const input = valeurs.valueInput(2026, 'Résultat');
  await input.fill('9');
  await input.press('Escape');
  await expect(input).toHaveCount(0);
  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('0');
  expect(writes).toHaveLength(0);

  await valeurs.valueButton(2026, 'Résultat').click();
  await input.dispatchEvent('compositionstart');
  await input.fill('12,345678');
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('12,345678');
  expect(writes).toHaveLength(0);

  await input.dispatchEvent('compositionend');
  const saved = valeurs.waitForUpsertValeurResponse();
  await input.press('Enter');
  await saved;
  await expect(input).toHaveCount(0);
  expect(writes).toHaveLength(1);
  await page.reload();
  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('12,35');
});

for (const [field, otherField, type, otherType] of [
  ['resultat', 'objectif', 'Résultat', 'Objectif'],
  ['objectif', 'resultat', 'Objectif', 'Résultat'],
] as const) {
  test(`Conserver le brouillon ${type} rouvert après une sauvegarde annulée`, async ({
    page,
    collectivites,
    indicateurs,
    indicateurDetailPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const indicateurId = await indicateurs.create(user, {
      collectiviteId,
      titre: 'Saisie rouverte pendant une sauvegarde',
      unite: '%',
    });
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId,
      indicateurId,
      periodicite: 'annuelle',
      dateValeur: '2026-01-01',
      [field]: 10,
    });
    await indicateurDetailPom.goto(collectiviteId, indicateurId);
    const valeurs = new IndicateurValeursPom(page);
    await valeurs.valueButton(2026, type).click();
    const input = valeurs.valueInput(2026, type);
    await input.fill('20');

    let releaseSave!: () => void;
    const pendingSave = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    await page.route(
      /indicateurs\.valeurs\.upsert/,
      async (route) => {
        await pendingSave;
        await route.continue();
      },
      { times: 1 }
    );
    const saved = valeurs.waitForUpsertValeurResponse();
    const refreshed = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes('indicateurs.valeurs.list') &&
        response.ok()
    );
    try {
      await input.press('Enter');
      await expect(input).toHaveAttribute('aria-busy', 'true');
      await input.press('Escape');
      await valeurs.valueButton(2026, type).click();
      await input.fill('30');
      await expect(input).toBeFocused();
    } finally {
      releaseSave();
    }
    await saved;
    await (await refreshed).finished();
    const persisted = await user
      .getTrpcClient()
      .indicateurs.valeurs.list.query({
        collectiviteId,
        indicateurIds: [indicateurId],
        periodicite: 'annuelle',
      });
    expect(
      persisted.indicateurs[0].sources.collectivite.valeurs[0]
    ).toMatchObject({
      [field]: 20,
    });
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('30');

    const draftSaved = valeurs.waitForUpsertValeurResponse();
    await input.press('Enter');
    await draftSaved;
    await expect(input).toHaveCount(0);
    await page.reload();
    await expect(valeurs.valueButton(2026, type)).toContainText('30');
  });

  test(`Sérialiser les sauvegardes ${type} après annulation dans une période vide`, async ({
    page,
    collectivites,
    indicateurs,
    indicateurDetailPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const indicateurId = await indicateurs.create(user, {
      collectiviteId,
      titre: 'Saisie rouverte dans une période vide',
      unite: '%',
    });
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId,
      indicateurId,
      periodicite: 'annuelle',
      dateValeur: '2026-01-01',
    });
    await indicateurDetailPom.goto(collectiviteId, indicateurId);
    const valeurs = new IndicateurValeursPom(page);
    const add = valeurs.cell(2026).getByTestId('indicateurs.valeurs.add');
    await add.click();
    await page.getByRole('button', { name: type, exact: true }).click();
    const input = valeurs.valueInput(2026, type);
    await input.fill('20');

    let releaseSave!: () => void;
    const pendingSave = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    await page.route(
      /indicateurs\.valeurs\.upsert/,
      async (route) => {
        await pendingSave;
        await route.continue();
      },
      { times: 1 }
    );
    const firstWrite = page.waitForRequest(/indicateurs\.valeurs\.upsert/);
    try {
      await input.press('Enter');
      await firstWrite;
      await expect(input).toHaveAttribute('aria-busy', 'true');
      await input.press('Escape');
      await add.click();
      await page.getByRole('button', { name: type, exact: true }).click();
      await input.fill('30');

      // La seconde écriture doit attendre la première, même après le retour
      // au menu vide. Observer les requêtes avant de libérer la réponse lente.
      const concurrentWrite = page
        .waitForRequest(/indicateurs\.valeurs\.upsert/, { timeout: 1000 })
        .then(
          () => true,
          () => false
        );
      await input.press('Enter');
      expect(await concurrentWrite).toBe(false);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('30');
    } finally {
      releaseSave();
    }
    await expect(input).toHaveCount(0);
    await page.reload();
    await expect(valeurs.valueButton(2026, type)).toContainText('30');
    const persisted = await user
      .getTrpcClient()
      .indicateurs.valeurs.list.query({
        collectiviteId,
        indicateurIds: [indicateurId],
        periodicite: 'annuelle',
      });
    expect(
      persisted.indicateurs[0].sources.collectivite.valeurs[0]
    ).toMatchObject({ [field]: 30 });
  });

  test(`Conserver le brouillon ${otherType} pendant l’effacement du dernier ${type}`, async ({
    page,
    collectivites,
    indicateurs,
    indicateurDetailPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const indicateurId = await indicateurs.create(user, {
      collectiviteId,
      titre: 'Saisie pendant un effacement',
      unite: '%',
    });
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId,
      indicateurId,
      periodicite: 'annuelle',
      dateValeur: '2026-01-01',
      [field]: 10,
    });
    await indicateurDetailPom.goto(collectiviteId, indicateurId);
    const valeurs = new IndicateurValeursPom(page);
    await valeurs.valueButton(2026, type).click();
    const input = valeurs.valueInput(2026, type);
    await input.fill('');

    let releaseSave!: () => void;
    const pendingSave = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    await page.route(
      /indicateurs\.valeurs\.upsert/,
      async (route) => {
        await pendingSave;
        await route.continue();
      },
      { times: 1 }
    );
    const saved = valeurs.waitForUpsertValeurResponse();
    const otherInput = valeurs.valueInput(2026, otherType);
    try {
      // Quitter le premier champ enregistre son effacement.
      await valeurs.valueButton(2026, otherType).click();
      await expect(input).toHaveAttribute('aria-busy', 'true');
      await otherInput.fill('30');
      await expect(otherInput).toBeFocused();
    } finally {
      releaseSave();
    }
    await saved;
    // Le retour du bouton confirme que la sauvegarde et son invalidation ont fini.
    await expect(valeurs.valueButton(2026, type)).toBeVisible();
    await expect(otherInput).toBeFocused();
    await expect(otherInput).toHaveValue('30');

    const draftSaved = valeurs.waitForUpsertValeurResponse();
    await otherInput.press('Enter');
    await draftSaved;
    await expect(otherInput).toHaveCount(0);
    await page.reload();
    await expect(valeurs.valueButton(2026, otherType)).toContainText('30');
    const persisted = await user
      .getTrpcClient()
      .indicateurs.valeurs.list.query({
        collectiviteId,
        indicateurIds: [indicateurId],
        periodicite: 'annuelle',
      });
    expect(
      persisted.indicateurs[0].sources.collectivite.valeurs[0]
    ).toMatchObject({
      [otherField]: 30,
    });
    expect(
      persisted.indicateurs[0].sources.collectivite.valeurs[0][field]
    ).toBeUndefined();
  });
}

for (const [content, value] of [
  ['un résultat zéro', { resultat: 0 }],
  ['un objectif zéro', { objectif: 0 }],
  ['un commentaire seul', { resultatCommentaire: 'À conserver' }],
] as const) {
  test(`Confirmer la suppression pour ${content}`, async ({
    page,
    collectivites,
    indicateurs,
    indicateurDetailPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const indicateurId = await indicateurs.create(user, {
      collectiviteId,
      titre: 'Suppression annuelle',
      unite: '%',
    });
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId,
      indicateurId,
      periodicite: 'annuelle',
      dateValeur: '2026-01-01',
      ...value,
    });
    await indicateurDetailPom.goto(collectiviteId, indicateurId);
    const valeurs = new IndicateurValeursPom(page);
    await valeurs.deletePeriodeButton(2026).click();
    const modal = page
      .getByRole('dialog')
      .filter({ hasText: 'Confirmer la suppression' });
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Annuler', exact: true }).click();
    await page.reload();
    await expect(valeurs.cell(2026)).toBeVisible();

    await valeurs.deletePeriodeButton(2026).click();
    const response = valeurs.waitForDeleteValeurResponse();
    await modal.getByRole('button', { name: 'Confirmer', exact: true }).click();
    await response;
    await page.reload();
    await expect(valeurs.table).toBeVisible();
    await expect(valeurs.cell(2026)).toHaveCount(0);
  });
}

test('Supprimer une période vide sans confirmation', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const indicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Période vide',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await valeurs.addResultat(2026, 0);
  await valeurs.editValeur(2026, 'Résultat', '');
  const response = valeurs.waitForDeleteValeurResponse();
  await valeurs.deletePeriodeButton(2026).click();
  await response;
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(valeurs.table).toBeVisible();
  await expect(valeurs.cell(2026)).toHaveCount(0);
});

test('Afficher les sources externes en lecture seule à côté des valeurs de la collectivité', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  await indicateurs.addResultats(user, {
    collectiviteId,
    identifiantReferentiel: 'cae_8',
    valeurs: [
      { dateValeur: '2025-01-01', resultat: 10, sourceId: 'citepa' },
      { dateValeur: '2026-01-01', resultat: 30, sourceId: 'citepa' },
      { dateValeur: '2026-01-01', resultat: 0 },
    ],
  });
  const { data: definitions } = await user
    .getTrpcClient()
    .indicateurs.indicateurs.list.query({
      collectiviteId,
      filters: { identifiantsReferentiel: ['cae_8'] },
    });
  const indicateurId = definitions[0].id;
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await expect(valeurs.cell(2026, 'citepa')).toContainText('30');
  await expect(valeurs.cell(2026, 'citepa').getByRole('button')).toHaveCount(0);
  await valeurs.editValeur(2026, 'Objectif', '25');
  await page.reload();
  await expect(valeurs.cell(2025, 'citepa')).toContainText('10');
  await expect(valeurs.cell(2026, 'citepa')).toContainText('30');
  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('0');
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('25');
  await valeurs.editCommentaire(2026, 'résultat', 'Mesure de la collectivité');
  await expect(valeurs.commentaireButton(2026)).toBeVisible();
  await new DropdownPom(
    page,
    page.getByTestId('indicateurs.sources-select')
  ).selectOption('Résultats Open data');
  await expect(valeurs.cell(2026, 'citepa')).toContainText('30');
  await expect(valeurs.cell(2026)).toHaveCount(0);
  await expect(
    valeurs.table.getByRole('button', { name: /Commentaires/ })
  ).toHaveCount(0);
});
