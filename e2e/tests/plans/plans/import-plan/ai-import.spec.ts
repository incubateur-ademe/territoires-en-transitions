import { expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'tests/main.fixture';
import { DemarchePcaetPom } from 'tests/demarches/pcaet/demarche-pcaet.pom';
import {
  AiImportFixture,
  importStatus,
  submitImport,
} from './ai-import.fixture';

const supportUser = {
  autoLogin: true,
  isSupport: true,
  isSuperAdminRoleEnabled: true,
} as const;

test('conserve le suivi sans plan au rechargement et affiche le rapport après échec', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await submitImport(page);
  await expect(page).toHaveURL(new RegExp(`importJobId=${mock.status.jobId}`));
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.ouvrir-plan')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('plans.import-ia.etapes')).toBeVisible();
  mock.status = {
    ...mock.status,
    status: 'failed',
    error: 'Référence inconnue',
    report: {
      issues: [
        {
          kind: 'document-error',
          code: 'UNKNOWN_REFERENCE',
          message: 'Corriger le code E99.',
          location: 'Tableau B, ligne 2',
        },
      ],
      qualitativeReview: null,
    },
  };
  mock.current = null;
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Corriger le code E99.'
  );
  await page.reload();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Tableau B, ligne 2'
  );
  await expect(
    page.getByText('Aucun plan n’est associé à cet import.')
  ).toBeVisible();
  await expect(
    page.getByTestId('plans.import-ia.reprendre-button')
  ).toHaveCount(0);
  expect(mock.enqueueCalls).toBe(1);
});

test('retrouve les imports paginés sans activer le lancement et ne redirige pas un compte rendu terminé', async ({
  page,
  collectivites,
  plans,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const planId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan terminé',
  });
  mock.recent = Array.from({ length: 21 }, (_, index) => ({
    ...importStatus,
    jobId: randomUUID(),
    planName: `Import ${index + 1}`,
    status: 'done',
    createdPlanId: planId,
  }));
  mock.status = {
    ...mock.recent[20],
    report: {
      issues: [],
      qualitativeReview: 'Vérifier les objectifs du plan.',
    },
  };
  await page.goto(`/collectivite/${collectivite.data.id}/plans`);
  await page
    .getByRole('link', { name: 'Historique des imports', exact: true })
    .click();
  await expect(page.getByRole('link', { name: 'Nouvel import' })).toHaveCount(
    0
  );
  await expect(
    page.getByTestId('plans.import-ia.historique').getByRole('listitem')
  ).toHaveCount(20);
  await page
    .getByRole('button', { name: 'Voir les imports précédents' })
    .click();
  await expect(
    page.getByTestId('plans.import-ia.historique').getByRole('listitem')
  ).toHaveCount(21);
  expect(mock.cursors).toContain(mock.recent[19].jobId);
  await page.getByRole('button', { name: 'Import 21', exact: true }).click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Vérifier les objectifs du plan.'
  );
  await page.reload();
  await expect(page).toHaveURL(
    new RegExp(`/imports\\?importJobId=${mock.status.jobId}`)
  );
  await expect(
    page.getByRole('heading', { name: 'Détails de l’import', exact: true })
  ).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.ouvrir-plan')).toBeVisible();
  await page.getByTestId('plans.import-ia.ouvrir-plan').click();
  await expect(page).toHaveURL(new RegExp(`/plans/${planId}$`));
  await page.getByTestId('plans.plan.menu').click();
  await page
    .getByRole('link', { name: 'Détails de l’import' })
    .click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Vérifier les objectifs du plan.'
  );
  const navigation = page.getByRole('navigation', {
    name: 'Navigation des imports de plans',
  });
  await navigation.getByRole('link', { name: 'Historique des imports' }).click();
  await expect(page).toHaveURL(
    new RegExp(`/collectivite/${collectivite.data.id}/plans/imports$`)
  );
  await expect(
    page.getByTestId('plans.import-ia.historique').getByRole('listitem')
  ).toHaveCount(20);
  await navigation.getByRole('link', { name: 'Plans', exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/collectivite/${collectivite.data.id}/plans$`)
  );
  expect(mock.enqueueCalls).toBe(0);
});

test('garde le suivi accessible sans permettre un nouvel import quand le lancement est désactivé', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status.status = 'failed';
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/importer-ia?importJobId=${mock.status.jobId}`
  );
  await expect(
    page.getByRole('heading', { name: 'Détails de l’import' })
  ).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nom du plan' })).toHaveCount(
    0
  );
  await page
    .getByRole('button', { name: 'Réessayer', exact: true })
    .click();
  await expect(page).not.toHaveURL(/importJobId=/);
  await expect(
    page.getByRole('link', { name: 'contact@territoiresentransitions.fr' })
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nom du plan' })).toHaveCount(
    0
  );
  await expect(
    page.getByRole('button', { name: "Lancer l'import" })
  ).toHaveCount(0);
  expect(mock.enqueueCalls).toBe(0);
});

test('retrouve les détails depuis le menu du plan importé, sans URL de suivi ni lancement activé', async ({
  page,
  collectivites,
  plans,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const planId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan importé',
  });
  const manualPlanId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan manuel',
  });
  mock.status = { ...mock.status, status: 'done', createdPlanId: planId };
  mock.recent = [
    { ...mock.status, jobId: randomUUID(), createdPlanId: null },
    mock.status,
  ];

  await page.goto(`/collectivite/${collectivite.data.id}/plans/${planId}`);
  await expect(page.getByTestId('plans.plan.menu')).toBeVisible();
  expect(mock.queriedPlanIds).toEqual([]);
  await page.getByTestId('plans.plan.menu').click();
  const details = page.getByRole('link', { name: 'Détails de l’import' });
  await expect(details).toHaveAttribute(
    'href',
    `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`
  );
  expect(mock.queriedPlanIds).toEqual([planId]);
  const actions = details.locator('..').locator(':scope > button, :scope > a');
  await expect(actions).toHaveText([
    /Rendre public l'ensemble des actions/,
    /Rendre privé l'ensemble des actions/,
    /Télécharger le plan \(Excel\)/,
    /Télécharger le plan \(Word\)/,
    /Générer un rapport \(PowerPoint\)/,
    /Détails de l’import/,
    /Dupliquer le plan/,
    /Supprimer le plan/,
  ]);
  await details.click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nouvel import' })).toHaveCount(0);

  await page.goto(`/collectivite/${collectivite.data.id}/plans/${manualPlanId}`);
  const loaded = page.waitForResponse(
    (response) => response.url().includes('plans.aiImport.listRecentAiImports')
  );
  await page.getByTestId('plans.plan.menu').click();
  await loaded;
  await expect(details).toHaveCount(0);
  expect(mock.queriedPlanIds).toContain(manualPlanId);

  const lecteur = await collectivite.addUser({ role: 'lecture' });
  await lecteur.login();
  await page.goto(`/collectivite/${collectivite.data.id}/plans/${planId}`);
  const queriesBefore = mock.queriedPlanIds.length;
  await page.getByTestId('plans.plan.menu').click();
  await expect(
    page.getByRole('button', { name: 'Télécharger le plan (Excel)' })
  ).toBeVisible();
  await expect(details).toHaveCount(0);
  expect(mock.queriedPlanIds).toHaveLength(queriesBefore);
  expect(mock.enqueueCalls).toBe(0);
  expect(mock.resumeCalls).toBe(0);
});

test('reprend un job sans plan et attend done et un plan avant la redirection', async ({
  page,
  collectivites,
  plans,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const planId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan repris',
  });
  mock.status = {
    ...mock.status,
    status: 'failed',
    resumable: true,
    error: 'Traitement interrompu',
  };
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/importer-ia?importJobId=${mock.status.jobId}`
  );
  await page.getByTestId('plans.import-ia.reprendre-button').click();
  await expect.poll(() => mock.resumeCalls).toBe(1);
  await expect(
    page.getByTestId('plans.import-ia.reprendre-button')
  ).toHaveCount(0);
  mock.status = { ...mock.status, createdPlanId: planId };
  const before = mock.statusCalls;
  await expect.poll(() => mock.statusCalls).toBeGreaterThan(before);
  await expect(page).toHaveURL(/importer-ia/);
  mock.status = {
    ...mock.status,
    status: 'done',
    report: { issues: [], qualitativeReview: 'Plan à relire.' },
  };
  mock.recent = [mock.status];
  await expect(page).toHaveURL(new RegExp(`/plans/${planId}$`));
  await page.getByTestId('plans.plan.menu').click();
  await page
    .getByRole('link', { name: 'Détails de l’import' })
    .click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Plan à relire.'
  );
});

test('ouvre le plan associé depuis le détail d’un import en échec sur mobile', async ({
  page,
  collectivites,
  plans,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const planId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan à compléter',
  });
  mock.status = {
    ...mock.status,
    status: 'failed',
    createdPlanId: planId,
    error: 'Traitement interrompu',
  };
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`
  );
  const openPlan = page.getByRole('link', { name: 'Ouvrir le plan' });
  await expect(openPlan).toBeInViewport();
  await expect(
    page.getByRole('link', { name: 'Nouvel import' })
  ).toBeInViewport();
  await expect(
    page.getByRole('region', { name: 'Détails de l’import' }).getByRole('link', {
      name: 'Ouvrir le plan',
    })
  ).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.rapport')).toBeVisible();
  await openPlan.click();
  await expect(page).toHaveURL(new RegExp(`/plans/${planId}$`));
  expect(mock.enqueueCalls).toBe(0);
  expect(mock.resumeCalls).toBe(0);
});

test('désactive l’ouverture sans plan et explique pourquoi dans l’infobulle', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status.status = 'done';
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`
  );
  await expect(page.getByText('Import terminé', { exact: true })).toBeVisible();
  const openPlan = page.getByRole('button', { name: 'Ouvrir le plan' });
  await expect(openPlan).toBeDisabled();
  await expect(openPlan).not.toHaveAttribute('href');
  // La bannière de connexion peut déplacer l'en-tête après le chargement.
  await expect(async () => {
    await openPlan.locator('..').hover();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Aucun plan n’est associé à cet import.',
      { timeout: 1000 }
    );
  }).toPass({ timeout: 5000 });
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('link', { name: 'Nouvel import' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip')).toHaveText(
    'Aucun plan n’est associé à cet import.'
  );
  const openPlanBox = await openPlan.boundingBox();
  const newImportBox = await page
    .getByRole('link', { name: 'Nouvel import' })
    .boundingBox();
  assert(openPlanBox && newImportBox);
  expect(openPlanBox.x + openPlanBox.width).toBeLessThan(newImportBox.x);
  expect(openPlanBox.y).toBe(newImportBox.y);
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/importer-ia?importJobId=${mock.status.jobId}`
  );
  await expect(page.getByText('Import terminé', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/importer-ia\?importJobId=/);
  await expect(page.getByRole('link', { name: 'Ouvrir le plan' })).toHaveCount(0);
});

test('affiche une erreur explicite pour un job inaccessible, sans polling', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.statusNotFound = true;
  await mock.install(page);
  await page.clock.install();
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`
  );
  await expect(
    page.getByText('Cet import est introuvable ou vous n’y avez pas accès.')
  ).toBeVisible();
  await page.clock.runFor(10_000);
  expect(mock.statusCalls).toBe(1);
  await expect(
    page.getByTestId('plans.import-ia.reprendre-button')
  ).toHaveCount(0);
});

test('rattache immédiatement le plan générique au PCAET et retrouve le suivi après fermeture', async ({
  page,
  collectivites,
  plans,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const demarche = new DemarchePcaetPom(page);
  await demarche.gotoCreatePage(collectivite.data.id);
  await demarche.createDemarche(collectivite.data.id);
  await demarche.gotoPlanActions();
  await demarche.importPlanButton.click();
  const types = await user.getTrpcClient().plans.plans.listTypes.query();
  const pcaetType = types.find(
    (type) => type.type === 'Plan Climat Air Énergie Territorial'
  );
  assert(pcaetType);
  const planId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan de test',
    typeId: pcaetType.id,
  });
  mock.status = { ...mock.status, profile: 'generic', createdPlanId: planId };
  await submitImport(page);
  await expect(page).toHaveURL(new RegExp(`importJobId=${mock.status.jobId}`));
  const modal = page.getByTestId('demarches.plan.import-plan-modal');
  await expect(modal.getByTestId('plans.import-ia.suivi')).toBeVisible();
  await modal.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(
    page.getByTestId('demarches.plan.row').filter({ hasText: 'Plan de test' })
  ).toHaveAttribute('data-linked', 'true');
  await page.reload();
  await demarche.importPlanButton.click();
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();
  mock.status = { ...mock.status, status: 'done' };
  mock.current = null;
  await expect(modal).not.toBeVisible();
  await expect(page).not.toHaveURL(/importJobId=/);
  await demarche.importPlanButton.click();
  await expect(
    page.getByRole('textbox', { name: 'Nom du plan' })
  ).toBeVisible();
  expect(mock.enqueueCalls).toBe(1);
});

test('retrouve un import déjà en cours et persiste son URL sans le relancer', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.current = mock.status;
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await expect(page).toHaveURL(new RegExp(`importJobId=${mock.status.jobId}`));
  await expect(page.getByTestId('plans.import-ia.etapes')).toBeVisible();
  expect(mock.enqueueCalls).toBe(0);
});

test('retrouve un échec sans plan depuis une liste vide et réserve la reprise à l’équipe', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status = { ...mock.status, status: 'failed', resumable: true };
  mock.recent = [mock.status];
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  await page.goto(`/collectivite/${collectivite.data.id}/plans`);
  await page
    .getByRole('link', { name: 'Historique des imports', exact: true })
    .click();
  await page.getByRole('button', { name: 'Plan de test', exact: true }).click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toBeVisible();
  await expect(
    page.getByTestId('plans.import-ia.reprendre-button')
  ).toHaveCount(0);
});
