import { expect, type Request } from '@playwright/test';
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

for (const { resultats, pointsVisibles } of [
  { resultats: [10, null, 0], pointsVisibles: 2 },
  { resultats: [0], pointsVisibles: 1 },
  { resultats: [10, 20, null, 0], pointsVisibles: 1 },
]) {
  test(`Afficher les points isolés du segment annuel ${JSON.stringify(
    resultats
  )}`, async ({ page, collectivites, indicateurs, indicateurDetailPom }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const parentId = await indicateurs.create(user, {
      collectiviteId,
      titre: 'Agrégation annuelle',
      unite: 'MWh',
    });
    const enfantId = await indicateurs.create(user, {
      collectiviteId,
      titre: 'Segment annuel',
      unite: 'MWh',
    });
    await indicateurs.setEnfants(parentId, [enfantId]);
    for (const [index, resultat] of resultats.entries()) {
      await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
        collectiviteId,
        indicateurId: enfantId,
        dateValeur: `${2024 + index}-01-01`,
        resultat,
      });
    }

    await indicateurDetailPom.goto(collectiviteId, parentId);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    // Vérifie les points réellement peints : une infobulle peut exister même
    // quand le point est invisible. Exclut la légende et les surfaces translucides.
    const getVisiblePoints = () =>
      canvas.evaluate((element: HTMLCanvasElement, color) => {
        const context = element.getContext('2d');
        if (!context) throw new Error('Canvas 2D indisponible');
        const ratio = element.height / element.clientHeight;
        const plotHeight = Math.floor(element.height - 80 * ratio);
        const { data } = context.getImageData(0, 0, element.width, plotHeight);
        const rgb = [1, 3, 5].map((offset) =>
          parseInt(color.slice(offset, offset + 2), 16)
        );
        const points: { width: number; minY: number; maxY: number }[] = [];
        let previousX = -2;
        for (let x = 0; x < element.width; x++) {
          const ys: number[] = [];
          for (let y = 0; y < plotHeight; y++) {
            const offset = (y * element.width + x) * 4;
            if (
              data[offset + 3] > 240 &&
              rgb.every(
                (value, index) => Math.abs(data[offset + index] - value) <= 1
              )
            )
              ys.push(y);
          }
          if (!ys.length) continue;
          if (x !== previousX + 1)
            points.push({ width: 0, minY: plotHeight, maxY: 0 });
          const point = points[points.length - 1];
          point.width++;
          point.minY = Math.min(point.minY, ...ys);
          point.maxY = Math.max(point.maxY, ...ys);
          previousX = x;
        }
        return points;
      }, '#E1E1FD'); // Première couleur de la palette des segments.

    await expect
      .poll(
        async () =>
          (
            await getVisiblePoints()
          ).filter((point) => point.width > 1 && point.maxY - point.minY > 1)
            .length
      )
      .toBe(pointsVisibles);
    for (const point of await getVisiblePoints()) {
      expect(point.width).toBeGreaterThan(1);
      expect(point.maxY - point.minY).toBeGreaterThan(1);
    }
    if (pointsVisibles === 2) {
      const [first, zero] = await getVisiblePoints();
      expect(zero.minY).toBeGreaterThan(first.maxY);
    }
  });
}

for (const type of ['resultat', 'objectif'] as const) {
  test(`Confirmer la suppression d'un ${type} annuel égal à zéro`, async ({
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
      titre: `${type} annuel égal à zéro`,
      unite: '%',
      estConfidentiel: true,
    });
    const trpc = user.getTrpcClient();
    for (const valeur of [
      { dateValeur: '2024-01-01', [type]: 12 },
      { dateValeur: '2025-01-01', [type]: 0 },
      { dateValeur: '2026-01-01' },
    ]) {
      await trpc.indicateurs.valeurs.upsert.mutate({
        collectiviteId,
        indicateurId,
        ...valeur,
      });
    }

    await indicateurDetailPom.goto(collectiviteId, indicateurId);
    const valeurs = new IndicateurValeursPom(page);
    const header = valeurs.table.getByRole('columnheader').filter({
      has: page.getByText('2025', { exact: true }),
    });
    await expect(header).toBeVisible();
    if (type === 'resultat') {
      // Une année vide plus récente ne doit pas déplacer le mode privé du zéro.
      await header.locator('.ri-lock-fill').hover();
      await expect(page.getByRole('tooltip')).toHaveText(
        'Le résultat est en mode privé'
      );
    }

    const deleteButton = header.getByRole('button', {
      name: 'Supprimer la période 2025',
      exact: true,
    });
    const confirmation = page.getByRole('dialog', {
      name: 'Confirmer la suppression',
    });
    await deleteButton.click();
    await expect(confirmation).toBeVisible();
    await confirmation
      .getByRole('button', { name: 'Annuler', exact: true })
      .click();
    await page.reload();
    await expect(header).toBeVisible();

    await deleteButton.click();
    await confirmation
      .getByRole('button', { name: 'Confirmer', exact: true })
      .click();
    await expect(header).toHaveCount(0);
    await page.reload();
    await expect(valeurs.table.getByText('2025', { exact: true })).toHaveCount(
      0
    );
    await expect(
      valeurs.table.getByText('2024', { exact: true })
    ).toBeVisible();
    await expect(
      valeurs.table.getByText('2026', { exact: true })
    ).toBeVisible();
  });
}

test('Ne pas charger une série annuelle pour une définition mensuelle', async ({
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
    titre: 'Périodicité du graphique',
    unite: '%',
  });

  // The public write API currently creates annual indicators only.
  await page.route('**/indicateurs.indicateurs.list*', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    for (const definition of body.result.data.data) {
      if (definition.id === indicateurId) definition.periodicite = 'mensuelle';
    }
    await route.fulfill({ response, json: body });
  });
  const valueRequests: Request[] = [];
  page.on('request', (request) => {
    if (!request.url().includes('indicateurs.valeurs.list')) return;
    const input = new URL(request.url()).searchParams.get('input');
    if (input && JSON.parse(input).indicateurIds?.includes(indicateurId)) {
      valueRequests.push(request);
    }
  });

  await page.goto(
    `/collectivite/${collectiviteId}/indicateurs/perso/${indicateurId}`
  );

  await expect(
    page.getByText('Erreur : INDICATEUR_ANNUAL_PERIODICITE_REQUIRED', {
      exact: true,
    })
  ).toBeVisible();
  expect(valueRequests).toHaveLength(0);

  // Prove that the same filter detects actual requests with our httpLink format.
  await page.unroute('**/indicateurs.indicateurs.list*');
  await page.reload();
  await expect.poll(() => valueRequests.length).toBeGreaterThan(0);
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
  const uniteInput = page.getByRole('textbox', {
    name: 'Unité',
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
  const writes: Request[] = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      request.url().includes('indicateurs.valeurs.upsert')
    )
      writes.push(request);
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
  await uniteInput.click();
  const blurResponse = await blurSave;
  expect(blurResponse.request().postDataJSON()).toMatchObject({
    collectiviteId,
    indicateurId,
    periodicite: 'annuelle',
    dateValeur: '2026-01-01',
  });
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(uniteInput).toBeFocused();
  expect(writes).toHaveLength(1);
  const cell = valeurs.cell(2026);
  await cell.getByTestId('indicateurs.valeurs.add').click();
  const objectifOption = page.getByRole('button', {
    name: 'Objectif',
    exact: true,
  });
  await expect(objectifOption).toBeEnabled();
  await objectifOption.click();
  const objectifInput = cell.getByRole('textbox', {
    name: 'Objectif — 2026',
    exact: true,
  });
  await expect(objectifInput).toBeVisible();
  await objectifInput.press('Escape');
  await expect(objectifInput).toHaveCount(0);
  expect(writes).toHaveLength(1);
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
    .getByRole('columnheader')
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
  await input.fill('2027');
  await input.press('Enter');
  await valeurs.editValeur(2027, 'Objectif', '5');
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

test('Conserver les bornes du calendrier annuel sans décalage après enregistrement', async ({
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
    titre: 'Bornes du calendrier annuel',
    unite: 'kg',
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  for (const year of ['9999', '0001']) {
    await valeurs.ajouterAnneeInput.fill(year);
    const saved = valeurs.waitForUpsertValeurResponse();
    await valeurs.ajouterAnneeInput.press('Enter');
    expect((await saved).request().postDataJSON()).toMatchObject({
      periodicite: 'annuelle',
      dateValeur: `${year}-01-01`,
    });
    await expect(valeurs.ajouterAnneeInput).toHaveValue('');
  }
  await page.reload();
  await expect(valeurs.cell(1)).toBeVisible();
  await expect(valeurs.cell(9999)).toBeVisible();
  const saved = await user.getTrpcClient().indicateurs.valeurs.list.query({
    collectiviteId,
    indicateurIds: [indicateurId],
    periodicite: 'annuelle',
  });
  expect(
    saved.indicateurs[0].sources.collectivite.valeurs
      .map(({ dateValeur }) => dateValeur)
      .sort()
  ).toEqual(['0001-01-01', '9999-01-01']);
  await valeurs.ajouterAnneeInput.fill('0001');
  await valeurs.ajouterAnneeInput.press('Enter');
  await expect(
    valeurs.table.getByText('Cette année est déjà présente dans le tableau.')
  ).toBeVisible();
  await expect(valeurs.cell(1)).toHaveCount(1);
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
  const uniteInput = page.getByRole('textbox', {
    name: 'Unité',
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
      await uniteInput.click();
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
  await uniteInput.click();
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
  const periodeHeaders = valeurs.table.getByRole('columnheader').filter({
    has: page.getByRole('button', { name: /Supprimer la période/ }),
  });
  await expect(periodeHeaders).toHaveText(['2025', '2026', '2027']);

  await valeurs.addResultat(2026, 0);
  await expect(periodeHeaders).toHaveText(['2025', '2026', '2027']);
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(1);
  await expect(valeurs.table.getByText('2027', { exact: true })).toBeVisible();
  await page.reload();
  await expect(periodeHeaders).toHaveText(['2025', '2026', '2027']);
  await input.fill('2026');
  await uniteInput.click();
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
  const uniteInput = page.getByRole('textbox', {
    name: 'Unité',
    exact: true,
  });
  const upsertUrl = /indicateurs\.valeurs\.upsert/;
  await page.route(upsertUrl, (route) => route.abort('failed'));

  await input.fill('2026');
  await uniteInput.click();

  await expect(
    valeurs.table.getByText("Erreur lors de l'enregistrement", { exact: true })
  ).toBeVisible();
  await expect(input).toHaveValue('2026');
  await expect(input).toBeEnabled();
  await expect(valeurs.table.getByText('2026', { exact: true })).toHaveCount(0);

  await page.unroute(upsertUrl);
  await input.click();
  const retrySave = valeurs.waitForUpsertValeurResponse();
  await uniteInput.click();
  await retrySave;

  await expect(input).toHaveValue('');
  await expect(uniteInput).toBeFocused();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
  await page.reload();
  await expect(valeurs.table.getByText('2026', { exact: true })).toBeVisible();
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Afficher la nouvelle année au début, au milieu et à la fin du tableau (animations : ${reducedMotion})`, async ({
    page,
    collectivites,
    indicateurs,
    indicateurDetailPom,
  }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion });
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const indicateurId = await indicateurs.create(user, {
      collectiviteId,
      titre: 'Navigation entre les années',
      unite: '%',
    });
    const years = [2014, 2016, 2018, 2020, 2022, 2024, 2026];
    for (const year of years) {
      await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
        collectiviteId,
        indicateurId,
        periodicite: 'annuelle',
        dateValeur: `${year}-01-01`,
        resultat: 10,
      });
    }
    await indicateurDetailPom.goto(collectiviteId, indicateurId);
    const valeurs = new IndicateurValeursPom(page);
    await expect(valeurs.scrollbar).toBeVisible();

    for (const year of [2028, 2015, 2012]) {
      await test.step(`Créer et compléter ${year}`, async () => {
        await valeurs.ajouterAnneeInput.fill(String(year));
        const saved = valeurs.waitForUpsertValeurResponse();
        await valeurs.ajouterAnneeInput.press('Enter');
        await saved;
        await expect(valeurs.ajouterAnneeInput).toHaveValue('');
        await expect(valeurs.ajouterAnneeInput).toBeFocused();
        await valeurs.expectPeriodeInView(year);
        await valeurs.editValeur(year, 'Objectif', '25');
        await expect(valeurs.valueButton(year, 'Objectif')).toContainText('25');
        years.push(year);
      });
    }

    await expect(
      valeurs.table.locator('thead th').filter({ hasText: /^20\d{2}/ })
    ).toHaveText(
      years.sort((a, b) => a - b).map((year) => new RegExp(`^${year}`))
    );
    // Editing another value must not reveal the last declared year again.
    await valeurs.scrollbar.press('End');
    await valeurs.expectPeriodeInView(2028);
    await valeurs.editValeur(2028, 'Objectif', '30');
    await expect(valeurs.valueButton(2028, 'Objectif')).toContainText('30');
    await valeurs.expectPeriodeInView(2028);
    await page.reload();
    for (const year of [2012, 2015, 2028]) {
      await expect(valeurs.valueButton(year, 'Objectif')).toContainText(
        year === 2028 ? '30' : '25'
      );
    }
  });
}

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
    new IndicateurValeursPom(page).table.getByRole('cell', {
      name: 'Aucune donnée disponible',
      exact: true,
    })
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
