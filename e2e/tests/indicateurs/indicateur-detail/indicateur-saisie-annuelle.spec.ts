import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { IndicateurValeursPom } from './indicateur-valeurs.pom';

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
  await expect(valeurs.table.locator('td')).toHaveCount(0);

  await valeurs.addResultat(2026, 0);
  await valeurs.editValeur(2026, 'Objectif', '20,12345');
  await valeurs.addResultat(2025, 12);
  await page.reload();

  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('0');
  // La valeur relue respecte la précision de deux décimales de l’indicateur.
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('20,12');
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

test('Conserver les commentaires de chaque valeur et les consulter en lecture seule', async ({
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
  await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
    collectiviteId,
    indicateurId,
    periodicite: 'annuelle',
    dateValeur: '2026-01-01',
    resultat: 0,
    objectif: 20,
  });
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const valeurs = new IndicateurValeursPom(page);
  await valeurs.editCommentaire(2026, 'résultat', 'Résultat mesuré');
  await valeurs.editCommentaire(2026, 'objectif', 'Objectif adopté');
  await page.reload();
  await expect(valeurs.valueButton(2026, 'Résultat')).toContainText('0');
  await expect(valeurs.valueButton(2026, 'Objectif')).toContainText('20');

  await collectivite.addUser({ role: 'lecture', autoLogin: true });
  await page.reload();
  await expect(valeurs.table).toBeVisible();
  await expect(valeurs.ajouterAnneeButton).toHaveCount(0);
  await expect(valeurs.deletePeriodeButton(2026)).toHaveCount(0);
  await expect(valeurs.valueButton(2026, 'Résultat')).toHaveCount(0);
  await expect(valeurs.valueButton(2026, 'Objectif')).toHaveCount(0);

  for (const [type, commentaire] of [
    ['résultat', 'Résultat mesuré'],
    ['objectif', 'Objectif adopté'],
  ] as const) {
    await valeurs.commentaireButton(2026, type).click();
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('textbox')).toHaveValue(commentaire);
    await expect(modal.getByRole('textbox')).toBeDisabled();
    await modal
      .getByRole('button', { name: 'Fermer', exact: true })
      .filter({ hasText: /^Fermer$/ })
      .click();
  }
});

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
});
