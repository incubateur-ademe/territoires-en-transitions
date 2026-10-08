import { expect } from '@playwright/test';
import { testWithIndicateurs as test } from '../indicateurs.fixture';
import { IndicateurValeursPom } from './indicateur-valeurs.pom';

test.beforeEach(async ({ page }) => {
  await page.addLocatorHandler(
    page
      .getByRole('dialog')
      .filter({ hasText: 'Rattachez ProConnect à votre compte' }),
    async (dialog) => {
      await dialog.getByRole('button', { name: 'Plus tard' }).click();
    }
  );
});

test('Déclarer une année persiste après rafraîchissement', async ({
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
    titre: 'Déclaration des années',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  const input = valeurs.table.getByRole('textbox', {
    name: 'Ajouter une année',
  });
  const submit = valeurs.table.getByRole('button', {
    name: 'Valider et ajouter une année',
  });
  const resultatsTab = page.getByRole('button', {
    name: 'Résultats',
    exact: true,
  });
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute('placeholder', 'Ajouter une année');
  await expect(
    valeurs.table.getByText('Ajouter une année', { exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Ajouter une année', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Ajouter une valeur' }).click();
  await expect(input).toBeFocused();
  const writes: string[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().includes('indicateurs.valeurs.upsert')
    )
      writes.push(request.url());
  });
  await input.fill('2026');
  await expect(submit).toBeVisible();
  await submit.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Ajouter une année');
  await input.press('Tab');
  await expect(submit).toBeFocused();
  expect(writes).toHaveLength(0);

  // Leaving the input and its validation button saves once, without stealing focus.
  const blurSave = valeurs.waitForUpsertValeurResponse();
  await resultatsTab.click();
  await blurSave;
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(resultatsTab).toBeFocused();
  expect(writes).toHaveLength(1);
  const objectifsTab = page.getByRole('button', {
    name: 'Objectifs',
    exact: true,
  });
  await expect(objectifsTab).toBeEnabled();
  await objectifsTab.click();
  await expect(objectifsTab).toHaveAttribute('aria-pressed', 'true');
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await valeurs.table
    .getByRole('button', { name: 'Supprimer la période 2026', exact: true })
    .click();
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(0);

  await input.fill('2026');
  // A click on a non-focusable area also saves the year.
  const outsideSave = valeurs.waitForUpsertValeurResponse();
  await valeurs.table
    .getByRole('row')
    .first()
    .getByRole('cell')
    .first()
    .click();
  await outsideSave;
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(input).not.toBeFocused();
  expect(writes).toHaveLength(2);
  await page.reload();
  await expect(input).toBeVisible();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();

  await valeurs.addResultat(2026, 0);
  await page.reload();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  expect(writes.length).toBeGreaterThan(0);

  // Deleting a saved value also removes its persisted period column.
  await valeurs.addResultat(2027, 5);
  await valeurs.table
    .getByRole('button', { name: 'Supprimer la période 2027', exact: true })
    .click();
  const confirmation = page.getByRole('dialog', {
    name: 'Confirmer la suppression',
  });
  await confirmation
    .getByRole('button', { name: 'Confirmer', exact: true })
    .click();
  await expect(valeurs.table.getByText('2027', { exact: true })).toHaveCount(0);
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();

  // The deleted period can be declared again without a stale duplicate error.
  await input.fill('2027');
  await input.press('Enter');
  await expect(input).toHaveValue('');
  await expect(valeurs.table.getByText('2027', { exact: true })).toBeVisible();
  await page.reload();
  await expect(input).toBeVisible();
  await expect(valeurs.table.getByText('2027', { exact: true })).toBeVisible();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
});

test('Valider les années et refuser les doublons avant et après enregistrement', async ({
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
    titre: 'Validation des années',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  const input = valeurs.table.getByRole('textbox', {
    name: 'Ajouter une année',
  });
  const submit = valeurs.table.getByRole('button', {
    name: 'Valider et ajouter une année',
  });
  const resultatsTab = page.getByRole('button', {
    name: 'Résultats',
    exact: true,
  });

  await test.step('Limiter la saisie à quatre chiffres', async () => {
    await input.pressSequentially('abc-+.,');
    await expect(input).toHaveValue('');
    await expect(submit).toHaveCount(0);

    await input.pressSequentially('2a0b2c6');
    await expect(input).toHaveValue('2026');
    await expect(submit).toBeVisible();

    await input.pressSequentially('7');
    await expect(input).toHaveValue('2026');
    await input.fill('');
  });

  for (const year of [
    '',
    '2',
    '20',
    '202',
    '0000',
    '20261',
    'année',
    '2026-01',
    '2026-T1',
    '2026-S1',
  ]) {
    await test.step(`Refuser l’année « ${year} »`, async () => {
      await input.fill('');
      await input.fill(year);
      await expect(input).toHaveValue(/^\d{0,4}$/);
      await expect(submit).toHaveCount(0);
      await input.press('Enter');
      const draft = await input.inputValue();
      await resultatsTab.click();
      await expect(input).toHaveValue(draft);
      await expect(
        valeurs.table.getByText(
          'Cette année est déjà présente dans le tableau.'
        )
      ).toHaveCount(0);
      await expect(
        valeurs.table.getByRole('button', { name: /Supprimer la période/ })
      ).toHaveCount(0);
    });
  }

  await input.fill('2026');
  await expect(submit).toBeVisible();
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(0);
  await submit.click();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(submit).toHaveCount(0);

  await input.fill('2026');
  await resultatsTab.click();
  await expect(submit).toHaveCount(0);
  await expect(input).toHaveValue('2026');
  await expect(
    valeurs.table.getByText('Cette année est déjà présente dans le tableau.')
  ).toBeVisible();
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(1);

  await input.fill('2027');
  await expect(submit).toBeVisible();
  await submit.click();
  await expect(valeurs.table.getByText('2027', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('');

  await input.fill('2025');
  await expect(submit).toBeVisible();
  await submit.click();
  const periodHeaders = valeurs.table.getByRole('columnheader').filter({
    has: page.getByRole('button', { name: /Supprimer la période/ }),
  });
  await expect(periodHeaders).toHaveText(['2025', '2026', '2027']);

  await valeurs.addResultat(2026, 0);
  await expect(periodHeaders).toHaveText(['2025', '2026', '2027']);
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(1);
  await expect(valeurs.table.getByText('2027', { exact: true })).toBeVisible();
  await page.reload();
  await expect(periodHeaders).toHaveText(['2025', '2026', '2027']);
  await input.fill('2026');
  await resultatsTab.click();
  await expect(submit).toHaveCount(0);
  await expect(
    valeurs.table.getByText('Cette année est déjà présente dans le tableau.')
  ).toBeVisible();
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(1);
});

test('Conserver une année après un échec au clic extérieur et permettre de réessayer', async ({
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
    titre: 'Nouvelle tentative de déclaration d’année',
    unite: '%',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  const input = valeurs.table.getByRole('textbox', {
    name: 'Ajouter une année',
  });
  const resultatsTab = page.getByRole('button', {
    name: 'Résultats',
    exact: true,
  });
  const upsertUrl = /indicateurs\.valeurs\.upsert/;
  await page.route(upsertUrl, (route) => route.abort('failed'));

  await input.fill('2026');
  await resultatsTab.click();

  await expect(
    valeurs.table.getByText("Erreur lors de l'enregistrement", { exact: true })
  ).toBeVisible();
  await expect(input).toHaveValue('2026');
  await expect(input).toBeEnabled();
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(0);

  await page.unroute(upsertUrl);
  await input.click();
  const retrySave = valeurs.waitForUpsertValeurResponse();
  await resultatsTab.click();
  await retrySave;

  await expect(input).toHaveValue('');
  await expect(resultatsTab).toBeFocused();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await page.reload();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
});

test('Ne pas proposer un ajout pour un indicateur sans valeur utilisateur', async ({
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
    titre: 'Indicateur sans valeur utilisateur',
    unite: '%',
  });
  await indicateurs.setSansValeurUtilisateur(indicateurId);

  await indicateurDetailPom.goto(collectiviteId, indicateurId);

  await expect(
    page.getByText(
      "Aucune valeur n'est associée aux résultats ou aux objectifs de la collectivité !"
    )
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ajouter une valeur', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('textbox', { name: 'Ajouter une année' })
  ).toHaveCount(0);
});

test('Ne pas proposer la déclaration ni la suppression des années en lecture seule', async ({
  page,
  collectivites,
  indicateurs,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const indicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Années en lecture seule',
    unite: '%',
  });
  await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
    collectiviteId,
    indicateurId,
    dateValeur: '2026-01-01',
    resultat: 0,
  });
  await collectivite.addUser({ role: 'lecture', autoLogin: true });
  await page.goto(
    `/collectivite/${collectiviteId}/indicateurs/perso/${indicateurId}`
  );
  const valeurs = new IndicateurValeursPom(page);
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await expect(
    valeurs.table.getByRole('textbox', { name: 'Ajouter une année' })
  ).toHaveCount(0);
  await expect(
    valeurs.table.getByRole('button', { name: /Supprimer la période/ })
  ).toHaveCount(0);
});
