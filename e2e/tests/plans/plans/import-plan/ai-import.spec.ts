import { expect, Page } from '@playwright/test';
import {
  PCAET_PLAN_TYPE_KEY,
  type DemarcheDocumentDepose,
} from '@tet/domain/demarches';
import { ELECTRIFICATION_PLAN_TYPE_KEY } from '@tet/domain/plans';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'tests/main.fixture';
import { DemarchePcaetPom } from 'tests/demarches/pcaet/demarche-pcaet.pom';
import {
  actionLevelQuestion,
  AiImportFixture,
  importStatus,
  submitImport,
} from './ai-import.fixture';

const supportUser = {
  autoLogin: true,
  isSupport: true,
  isSuperAdminRoleEnabled: true,
} as const;

function electrificationOption(page: Page) {
  return page
    .getByTestId('ai-import.plan-type-options')
    .getByText(ELECTRIFICATION_PLAN_TYPE_KEY.categorie, { exact: true })
    .locator('..')
    .getByRole('button', {
      name: ELECTRIFICATION_PLAN_TYPE_KEY.type,
      exact: true,
    });
}

async function selectElectrification(page: Page) {
  await page.getByTestId('ai-import.plan-type').click();
  await electrificationOption(page).click();
}

test('importe un plan de n’importe quel type par le profil générique, sans mode super-admin', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const types = await user.getTrpcClient().plans.plans.listTypes.query();
  const otherType = types.find(
    ({ type, detail }) =>
      type !== PCAET_PLAN_TYPE_KEY.type &&
      type !== ELECTRIFICATION_PLAN_TYPE_KEY.type &&
      !detail
  );
  assert(otherType);
  await page.goto(`/collectivite/${collectivite.data.id}/plans`);
  await page
    .getByRole('button', { name: 'Ajouter un plan', exact: true })
    .click();
  const tile = page.getByTestId('choix-creation-plan.importer-ia');
  await expect(tile).toContainText('pour tous les types de plan');
  await tile.click();
  await expect(page.getByText(/L'import IA est disponible pour/)).toHaveCount(
    0
  );
  await page.getByRole('textbox', { name: 'Nom du plan' }).fill('Plan de test');
  await page.getByTestId('ai-import.plan-type').click();
  await page
    .getByTestId('ai-import.plan-type-options')
    .getByRole('button', { name: otherType.type, exact: true })
    .click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'plan.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Axe,Action\nMobilité,Piste cyclable'),
  });
  await page.getByTestId('ai-import.lancer').click();
  await expect(page).toHaveURL(/importJobId=/);
  expect(mock.enqueuedForms[0].get('profile')).toBe('generic');
  expect(mock.enqueuedForms[0].get('planType')).toBe(String(otherType.id));
  expect(mock.enqueueCalls).toBe(1);
});

test('explique la restriction quand le profil générique est fermé', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.capabilities.profiles = [
    { profile: 'generic', available: false },
    { profile: 'pcaet', available: true },
    { profile: 'annexe-3-electrification', available: false },
  ];
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const types = await user.getTrpcClient().plans.plans.listTypes.query();
  const otherType = types.find(
    ({ type, detail }) =>
      type !== PCAET_PLAN_TYPE_KEY.type &&
      type !== ELECTRIFICATION_PLAN_TYPE_KEY.type &&
      !detail
  );
  assert(otherType);
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  const restriction = page.getByText(
    "L'import IA est disponible pour les plans PCAET. Sélectionnez un type disponible pour continuer.",
    { exact: true }
  );
  await expect(restriction).toBeVisible();
  await expect(page.getByTestId('ai-import.lancer')).toBeDisabled();
  await expect(
    page.getByRole('link', { name: 'contact@territoiresentransitions.fr' })
  ).toHaveCount(0);
  await page.getByTestId('ai-import.plan-type').click();
  await page
    .getByTestId('ai-import.plan-type-options')
    .getByRole('button', { name: otherType.type, exact: true })
    .click();
  await expect(restriction).toBeVisible();
  await expect(page.getByTestId('ai-import.lancer')).toBeDisabled();
  await expect(
    page.getByRole('link', { name: 'contact@territoiresentransitions.fr' })
  ).toHaveAttribute('href', 'mailto:contact@territoiresentransitions.fr');
  await submitImport(page);
  await expect(page).toHaveURL(/importJobId=/);
  expect(mock.enqueuedForms[0].get('profile')).toBe('pcaet');
  expect(mock.enqueueCalls).toBe(1);
});

test("conserve l'historique si la modale est fermée avant la réponse de l'envoi", async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  const release = mock.pauseEnqueueResponse();
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const historyUrl = `/collectivite/${collectivite.data.id}/plans/imports`;
  try {
    await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
    await submitImport(page);
    await expect.poll(() => mock.enqueuedForms.length).toBe(1);
    await page.getByTestId('close-plans.import-ia.modal').click();
    await expect(page).toHaveURL(new RegExp(`${historyUrl}$`));
    const response = page.waitForResponse((response) =>
      response.url().endsWith('/plans/import-ia')
    );
    mock.recent = [mock.status];
    release();
    await response;
    await expect(
      page.getByTestId('plans.import-ia.historique').getByText('Plan de test')
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${historyUrl}$`));
    await expect(page.getByTestId('plans.import-ia.modal')).toHaveCount(0);
  } finally {
    release();
  }
});

test('recharge les capacités d’import après désactivation du mode super-admin', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.capabilities.profiles = [
    { profile: 'annexe-3-electrification', available: true },
  ];
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await expect(
    page.getByText(
      "L'import IA est disponible pour les plans Électrification. Sélectionnez un type disponible pour continuer.",
      { exact: true }
    )
  ).toBeVisible();
  await selectElectrification(page);
  await page.getByTestId('close-plans.import-ia.modal').click();
  await expect(page).toHaveURL(new RegExp(`/plans/imports$`));
  await expect(
    page.getByTestId('plans.import-ia.nouveau-button')
  ).toBeVisible();
  mock.capabilities.profiles = [
    { profile: 'annexe-3-electrification', available: false },
  ];

  const refreshedCapabilities = page.waitForResponse((response) =>
    response.url().includes('plans.aiImport.getAiImportCapabilities')
  );
  const superAdminMode = page
    .getByRole('checkbox', { name: 'Mode super-admin' })
    .first();
  await superAdminMode.click();
  await expect(superAdminMode).not.toBeChecked();
  await refreshedCapabilities;
  await expect(page.getByTestId('plans.import-ia.nouveau-button')).toHaveCount(
    0
  );
  await expect(
    page.getByRole('heading', { name: 'Accès non autorisé' })
  ).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.historique')).toHaveCount(0);
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await expect(page.getByTestId('ai-import.plan-type')).toBeVisible();
  await expect(
    page.getByText(/L'import IA n'est pas disponible/)
  ).toBeVisible();
  await expect(page.getByTestId('ai-import.lancer')).toBeDisabled();
  expect(mock.enqueueCalls).toBe(0);
});

for (const capability of ['disabled', 'missing'] as const) {
  test(`explique l'indisponibilité du type Électrification si sa capacité est ${
    capability === 'disabled' ? 'désactivée' : 'absente'
  }`, async ({ page, collectivites }) => {
    const mock = new AiImportFixture();
    if (capability === 'missing') {
      mock.capabilities.profiles = [{ profile: 'pcaet', available: true }];
    }
    await mock.install(page);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: supportUser,
    });
    await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
    await page.getByTestId('ai-import.plan-type').click();
    await expect(
      page.getByRole('button', { name: 'Plan Climat Air Énergie Territorial' })
    ).toBeVisible();
    await electrificationOption(page).click();
    await expect(
      page.getByText(/L'import de ce type de plan n'est pas disponible/)
    ).toBeVisible();
    await expect(page.getByTestId('ai-import.lancer')).toBeDisabled();
    await expect(
      page.getByRole('link', { name: 'contact@territoiresentransitions.fr' })
    ).toBeVisible();

    // Un type autorisé reste utilisable après avoir consulté le refus.
    await page.getByTestId('ai-import.plan-type').click();
    await page
      .getByRole('button', { name: PCAET_PLAN_TYPE_KEY.type, exact: true })
      .click();
    await expect(page.getByTestId('ai-import.lancer')).toBeEnabled();
    await expect(
      page.getByRole('link', { name: 'contact@territoiresentransitions.fr' })
    ).toHaveCount(0);
    await expect(
      page.getByText(/L'import de ce type de plan n'est pas disponible/)
    ).toHaveCount(0);
    await expect(page).not.toHaveURL(/importJobId=/);
    expect(mock.enqueueCalls).toBe(0);
  });
}

test('importe le DOCX avec le profil Électrification et conserve le rapport après fermeture de son accès', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status.profile = 'annexe-3-electrification';
  mock.status.status = 'pending';
  mock.status.stepStates = {
    reading: 'pending',
    extraction: 'pending',
    scouting: 'skipped',
    hierarchy: 'skipped',
    scoring: 'skipped',
    consolidation: 'skipped',
    enrichment: 'skipped',
    secteurs: 'skipped',
    qualitativeReview: 'skipped',
  };
  mock.capabilities.profiles = [
    { profile: 'pcaet', available: true },
    { profile: 'annexe-3-electrification', available: true },
  ];
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const types = await user.getTrpcClient().plans.plans.listTypes.query();
  const electrificationType = types.find(
    ({ categorie, type }) =>
      categorie === ELECTRIFICATION_PLAN_TYPE_KEY.categorie &&
      type === ELECTRIFICATION_PLAN_TYPE_KEY.type
  );
  assert(electrificationType);
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await page.getByRole('textbox', { name: 'Nom du plan' }).fill('Plan de test');
  const instructions = page.getByRole('textbox', {
    name: "Précisions pour l'IA (facultatif)",
  });
  await instructions.fill('Consigne réservée à un import générique.');
  await page
    .getByRole('checkbox', { name: 'Mon document contient des sous-actions' })
    .uncheck();
  await selectElectrification(page);
  await expect(instructions).toHaveCount(0);
  await expect(
    page.getByText('Annexe 3 de la convention signée sur Word')
  ).toBeVisible();
  await expect(
    page.getByText(/Les budgets et financements ne sont pas importés/)
  ).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveAttribute(
    'accept',
    '.docx'
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: 'plan.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Axe,Action\nMobilité,Piste cyclable'),
  });
  await page.getByTestId('ai-import.lancer').click();
  await expect(
    page.getByText('Utilisez le canevas officiel V4 au format Word (.docx).')
  ).toBeVisible();
  await expect(page).not.toHaveURL(/importJobId=/);
  expect(mock.enqueueCalls).toBe(0);
  await page.getByTestId('ai-import.retirer-fichier').click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'plan-electrification.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('Document synthétique, requête interceptée.'),
  });
  await page.getByTestId('ai-import.lancer').click();
  await expect(page).toHaveURL(new RegExp(`importJobId=${mock.status.jobId}`));
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.ouvrir-plan')).toHaveCount(0);
  await expect(page.getByTestId('plans.import-ia.modal')).toBeVisible();
  await page.getByTestId('close-plans.import-ia.modal').click();
  await expect(page).toHaveURL(new RegExp(`/plans/imports$`));
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/importer-ia?importJobId=${mock.status.jobId}`
  );
  expect(mock.enqueueCalls).toBe(1);
  const form = mock.enqueuedForms[0];
  expect(form.get('profile')).toBe('annexe-3-electrification');
  expect(form.get('planType')).toBe(String(electrificationType.id));
  expect(form.get('withSousActions')).toBe('true');
  expect(form.get('withVerifications')).toBe('false');
  expect(form.get('instructions')).toBeNull();
  expect(form.get('file')).toHaveProperty('name', 'plan-electrification.docx');

  const steps = page
    .getByTestId('plans.import-ia.etapes')
    .getByRole('listitem');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toHaveAttribute('data-status', 'waiting');
  mock.status.status = 'running';
  await expect(steps.nth(0)).toHaveAttribute('data-status', 'current');
  await expect(page.getByTestId('plans.import-ia.chargement')).toBeVisible();
  mock.status.stepStates.reading = 'ok';
  await expect(steps.nth(0)).toHaveAttribute('data-status', 'done');
  await expect(steps.nth(1)).toHaveAttribute('data-status', 'current');
  mock.status.stepStates.extraction = 'ok';
  await expect(steps.nth(1)).toHaveAttribute('data-status', 'done');
  await expect(steps.nth(2)).toHaveAttribute('data-status', 'current');
  await expect(steps.nth(2)).toContainText('Création du plan');
  await expect(steps).toHaveCount(3);

  mock.capabilities.profiles = [{ profile: 'pcaet', available: true }];
  await page.reload();
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();
  mock.status = {
    ...mock.status,
    status: 'failed',
    error: 'Référence inconnue',
    report: {
      issues: [
        {
          kind: 'document-error',
          code: 'UNKNOWN_REFERENCE',
          message: 'Corriger la référence de la fiche.',
          location: 'Tableau B, ligne 2',
        },
        {
          kind: 'warning',
          code: 'AIDE_WITHOUT_URL_IGNORED',
          message: 'Le catalogue ne fournit pas de lien pour cette aide.',
          location: 'Aide "ChargeFrance"',
        },
      ],
      qualitativeReview: null,
    },
  };
  mock.current = null;
  await expect(
    page.getByTestId('plans.import-ia.modal').getByRole('alert')
  ).toContainText("L'import a échoué");
  await expect(page.getByTestId('plans.import-ia.rapport')).toHaveCount(0);
  await page
    .getByRole('link', { name: 'Voir le compte rendu', exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/imports\\?importJobId=${mock.status.jobId}$`)
  );
  await expect(page.getByTestId('plans.import-ia.modal')).toHaveCount(0);
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Corriger la référence de la fiche.'
  );
  await expect(
    page.getByRole('group', { name: 'Lecture du document', exact: true })
  ).toContainText('Terminée');
  await expect(
    page.getByRole('group', { name: 'Extraction des données', exact: true })
  ).toContainText('Terminée');
  await expect(page.getByTestId('plans.import-ia.etapes')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Tableau B, ligne 2'
  );
  await expect(
    page
      .getByTestId('plans.import-ia.rapport')
      .getByText('Le catalogue ne fournit pas de lien pour cette aide.', {
        exact: true,
      })
  ).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.etapes')).toHaveCount(0);
  await expect(page.getByTestId('plans.import-ia.chargement')).toHaveCount(0);
  expect(mock.enqueueCalls).toBe(1);
});

test('conserve les choix après un échec et un rechargement, puis permet de remplacer le document', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const types = await user.getTrpcClient().plans.plans.listTypes.query();
  const planType = types.find(({ type }) => type === PCAET_PLAN_TYPE_KEY.type);
  assert(planType);
  const defaults = {
    planName: 'Programme à corriger',
    planType: planType.id,
    instructions: 'Conserver les titres du document.',
    withVerifications: false,
    withSousActions: false,
  };
  mock.status.retryDefaults = defaults;
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await page
    .getByRole('textbox', { name: 'Nom du plan' })
    .fill(defaults.planName);
  await page.getByTestId('ai-import.plan-type').click();
  await page
    .getByRole('button', { name: PCAET_PLAN_TYPE_KEY.type, exact: true })
    .click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('Document synthétique, requête interceptée.'),
  });
  await page
    .getByRole('textbox', { name: "Précisions pour l'IA (facultatif)" })
    .fill(defaults.instructions);
  await page
    .getByRole('checkbox', { name: 'Vérifier et consolider les actions' })
    .uncheck();
  await page
    .getByRole('checkbox', { name: 'Mon document contient des sous-actions' })
    .uncheck();
  await page.getByTestId('ai-import.lancer').click();
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();

  const correction = 'Renseignez une année de référence pour ce résultat.';
  mock.status = {
    ...mock.status,
    status: 'failed',
    error: correction,
    report: {
      issues: [
        {
          kind: 'document-error',
          code: 'MISSING_INDICATEUR_YEAR',
          message: correction,
          location:
            'Action "Rénover la mairie" > Indicateur "Consommation" > Résultat',
        },
      ],
      qualitativeReview: null,
    },
  };
  mock.current = null;
  await expect(
    page.getByTestId('plans.import-ia.modal').getByRole('alert')
  ).toContainText("L'import a échoué");
  await expect(page.getByTestId('plans.import-ia.rapport')).toHaveCount(0);
  await page.reload();
  await page
    .getByRole('link', { name: 'Voir le compte rendu', exact: true })
    .click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    correction
  );
  await expect(page.getByText(correction)).toHaveCount(1);
  await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`retryJobId=${mock.status.jobId}`));
  await expect(page).not.toHaveURL(/importJobId=/);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Nom du plan' })).toHaveValue(
    defaults.planName
  );
  await expect(page.getByTestId('ai-import.plan-type')).toContainText(
    PCAET_PLAN_TYPE_KEY.type
  );
  await expect(
    page.getByRole('textbox', { name: "Précisions pour l'IA (facultatif)" })
  ).toHaveValue(defaults.instructions);
  await expect(
    page.getByRole('checkbox', { name: 'Vérifier et consolider les actions' })
  ).not.toBeChecked();
  await expect(
    page.getByRole('checkbox', {
      name: 'Mon document contient des sous-actions',
    })
  ).not.toBeChecked();
  await expect(page.locator('input[type="file"]')).toHaveValue('');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'plan-corrige.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('Document corrigé, requête interceptée.'),
  });
  await page.getByTestId('ai-import.lancer').click();
  await expect.poll(() => mock.enqueueCalls).toBe(2);
  expect(mock.resumeCalls).toBe(0);
  const retry = mock.enqueuedForms[1];
  expect(retry.get('planName')).toBe(defaults.planName);
  expect(retry.get('planType')).toBe(String(defaults.planType));
  expect(retry.get('instructions')).toBe(defaults.instructions);
  expect(retry.get('withVerifications')).toBe('false');
  expect(retry.get('withSousActions')).toBe('false');
  expect(retry.get('file')).toHaveProperty('name', 'plan-corrige.pdf');
  await expect(page).not.toHaveURL(/retryJobId=/);
});

test('réessaie depuis le détail avec les choix précédents et garde Nouvel import vierge', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status = {
    ...mock.status,
    status: 'failed',
    error: 'Traitement interrompu pendant la reprise.',
    stepStates: { ...mock.status.stepStates, scouting: 'skipped' },
    retryDefaults: {
      planName: 'Plan précédent',
      planType: null,
      instructions: 'Consigne précédente',
      withVerifications: false,
      withSousActions: false,
    },
    report: {
      issues: [
        {
          kind: 'configuration-error',
          code: 'PENDING_ENGAGEMENT_INDICATEUR',
          message:
            'La correspondance de cet indicateur reste à valider par notre équipe.',
          location:
            'Engagement "Installer des bornes" > Nombre total de bornes publiques',
        },
        {
          kind: 'configuration-error',
          code: 'PENDING_ENGAGEMENT_INDICATEUR',
          message:
            'La correspondance de cet indicateur reste à valider par notre équipe.',
          location:
            'Engagement "Installer des bornes" > Nombre de bornes rapides',
        },
        {
          kind: 'warning',
          code: 'EMPTY_ENGAGEMENT_TARGET',
          message:
            "Aucune valeur chiffrée n'est renseignée pour cet engagement.",
        },
      ],
      qualitativeReview: null,
    },
  };
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const detailUrl = `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`;
  await page.goto(detailUrl);
  await expect(
    page
      .getByTestId('plans.import-ia.rapport')
      .getByText('Erreur', { exact: true })
  ).toHaveCount(2);
  await expect(
    page.getByText('Traitement interrompu pendant la reprise.')
  ).toBeVisible();
  const report = page.getByTestId('plans.import-ia.rapport');
  const summary = report.getByRole('alert');
  await expect(summary).toHaveCount(1);
  await expect(summary).toContainText("L'import a échoué");
  const readingStatus = report.getByRole('group', {
    name: 'Lecture du document',
    exact: true,
  });
  const extractionStatus = report.getByRole('group', {
    name: 'Extraction des données',
    exact: true,
  });
  await expect(readingStatus).toContainText('Terminée');
  await expect(extractionStatus).toContainText('En échec');
  const readingBox = await readingStatus.boundingBox();
  const extractionBox = await extractionStatus.boundingBox();
  assert(readingBox && extractionBox);
  expect(readingBox.y).toBe(extractionBox.y);
  expect(extractionBox.x).toBeGreaterThan(readingBox.x);
  await expect(summary).toContainText(
    '2 erreurs détectées pendant cet import.'
  );
  const remarks = report.getByRole('listitem');
  await expect(remarks).toHaveCount(3);
  await expect(remarks.nth(0)).toContainText('Point 1 sur 3');
  await expect(remarks.nth(0)).toContainText(
    'Nombre total de bornes publiques'
  );
  await expect(remarks.nth(1)).toContainText('Point 2 sur 3');
  await expect(remarks.nth(1)).toContainText('Nombre de bornes rapides');
  await expect(remarks.nth(2)).toContainText('Point 3 sur 3');
  await expect(page.getByTestId('plans.import-ia.etapes')).toHaveCount(0);
  await expect(page.getByTestId('plans.import-ia.chargement')).toHaveCount(0);
  await expect(
    report.getByText('Avertissement', { exact: true })
  ).toBeVisible();
  await expect(
    summary.getByText(
      /^Contactez le support avec votre document et ce compte rendu/
    )
  ).toHaveCount(1);
  await expect(
    summary.getByRole('link', { name: 'Contacter le support' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Réessayer', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nom du plan' })).toHaveValue(
    'Plan précédent'
  );
  await expect(
    page.getByRole('textbox', { name: "Précisions pour l'IA (facultatif)" })
  ).toHaveValue('Consigne précédente');
  await page.goto(detailUrl);
  await page.getByTestId('plans.import-ia.nouveau-button').click();
  await expect(page).not.toHaveURL(/retryJobId=/);
  await expect(page.getByRole('textbox', { name: 'Nom du plan' })).toHaveValue(
    ''
  );
  await expect(
    page.getByRole('textbox', { name: "Précisions pour l'IA (facultatif)" })
  ).toHaveValue('');
  await expect(
    page.getByRole('checkbox', {
      name: 'Mon document contient des sous-actions',
    })
  ).toBeChecked();
  expect(mock.enqueueCalls).toBe(0);
  expect(mock.resumeCalls).toBe(0);
});

test('ouvre le plan Électrification terminé quand seul ce profil est disponible', async ({
  page,
  collectivites,
  plans,
}) => {
  const mock = new AiImportFixture();
  mock.status.profile = 'annexe-3-electrification';
  mock.capabilities.profiles = [
    { profile: 'generic', available: false },
    { profile: 'pcaet', available: false },
    { profile: 'annexe-3-electrification', available: true },
  ];
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const planId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan importé',
  });
  await page.goto(`/collectivite/${collectivite.data.id}/plans`);
  await page
    .getByRole('button', { name: 'Ajouter un plan', exact: true })
    .click();
  await expect(
    page.getByTestId('choix-creation-plan.demander-import')
  ).toHaveAttribute(
    'href',
    `/collectivite/${collectivite.data.id}/plans/importer`
  );
  await expect(
    page.getByTestId('choix-creation-plan.importer-ia')
  ).toContainText('Électrification');
  await expect(
    page.getByTestId('choix-creation-plan.importer-ia')
  ).not.toContainText('PCAET');
  await page.getByTestId('choix-creation-plan.importer-ia').click();
  await page.getByRole('textbox', { name: 'Nom du plan' }).fill('Plan de test');
  await page.getByTestId('ai-import.plan-type').click();
  await expect(
    page.getByTestId('ai-import.plan-type-options').getByRole('button', {
      name: PCAET_PLAN_TYPE_KEY.type,
      exact: true,
    })
  ).toBeVisible();
  await electrificationOption(page).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'plan-electrification.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from('Document synthétique, requête interceptée.'),
  });
  await page.getByTestId('ai-import.lancer').click();
  await expect(page).toHaveURL(new RegExp(`importJobId=${mock.status.jobId}`));
  await expect(page.getByTestId('plans.import-ia.ouvrir-plan')).toHaveCount(0);
  mock.status = { ...mock.status, status: 'done', createdPlanId: planId };
  mock.current = null;
  mock.recent = [mock.status];
  await expect(page).toHaveURL(new RegExp(`/plans/${planId}$`));
  expect(mock.enqueueCalls).toBe(1);
  expect(mock.enqueuedForms[0].get('profile')).toBe('annexe-3-electrification');
});

test('propose le compte rendu depuis la modale PCAET après échec et rechargement', async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status.profile = 'pcaet';
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const demarche = new DemarchePcaetPom(page);
  await demarche.gotoCreatePage(collectivite.data.id);
  await demarche.createDemarche(collectivite.data.id);
  await demarche.gotoPlanActions();
  await demarche.importPlanButton.click();
  await submitImport(page);
  await expect(page).toHaveURL(new RegExp(`importJobId=${mock.status.jobId}`));
  expect(mock.enqueuedForms[0].get('profile')).toBe('pcaet');
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.ouvrir-plan')).toHaveCount(0);
  await page.reload();
  await demarche.importPlanButton.click();
  await expect(
    page.getByTestId('plans.import-ia.etapes-simplifiees')
  ).toBeVisible();
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
  const reportLink = page.getByRole('link', {
    name: 'Voir le compte rendu',
    exact: true,
  });
  await expect(reportLink).toHaveAttribute(
    'href',
    `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`
  );
  await expect(page.getByTestId('plans.import-ia.rapport')).toHaveCount(0);
  await expect(page.getByText('Corriger le code E99.')).toHaveCount(0);
  await expect(
    page.getByTestId('plans.import-ia.etapes-simplifiees')
  ).toHaveCount(0);
  await page.reload();
  await demarche.importPlanButton.click();
  await reportLink.click();
  await expect(
    page.getByTestId('demarches.plan.import-plan-modal')
  ).toHaveCount(0);
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Tableau B, ligne 2'
  );
  await expect(page.getByTestId('plans.import-ia.etapes')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  await expect(
    page.getByText('Aucun plan n’est associé à cet import.')
  ).toBeVisible();
  await expect(
    page.getByTestId('plans.import-ia.reprendre-button')
  ).toHaveCount(0);
  expect(mock.enqueueCalls).toBe(1);
});

test('retrouve les imports paginés avec accès et ne redirige pas un compte rendu terminé', async ({
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
  await expect(page.getByRole('link', { name: 'Nouvel import' })).toBeVisible();
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
  await page.getByRole('link', { name: 'Détails de l’import' }).click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Vérifier les objectifs du plan.'
  );
  const navigation = page.getByRole('navigation', {
    name: 'Navigation des imports de plans',
  });
  await navigation
    .getByRole('link', { name: 'Historique des imports' })
    .click();
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

test("masque l'historique et refuse ses accès directs quand l'import est désactivé", async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status.status = 'failed';
  mock.capabilities.profiles = [];
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  await page.goto(`/collectivite/${collectivite.data.id}/plans`);
  await expect(
    page.getByRole('link', { name: 'Historique des imports', exact: true })
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Ajouter un plan', exact: true })
    .click();
  await expect(page.getByTestId('choix-creation-plan.importer-ia')).toHaveCount(
    0
  );
  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await selectElectrification(page);
  await expect(
    page.getByText(/L'import IA n'est pas disponible/)
  ).toBeVisible();
  await expect(page.getByTestId('ai-import.lancer')).toBeDisabled();

  for (const path of [
    'imports',
    `imports?importJobId=${mock.status.jobId}`,
    `importer-ia?importJobId=${mock.status.jobId}`,
  ]) {
    await page.goto(`/collectivite/${collectivite.data.id}/plans/${path}`);
    await expect(
      page.getByRole('heading', { name: 'Accès non autorisé' })
    ).toBeVisible();
    await expect(page.getByTestId('plans.import-ia.historique')).toHaveCount(0);
    await expect(page.getByTestId('plans.import-ia.suivi')).toHaveCount(0);
    await expect(
      page.getByTestId('plans.import-ia.nouveau-button')
    ).toHaveCount(0);
  }
  expect(mock.cursors).toEqual([]);
  expect(mock.statusCalls).toBe(0);

  await page.goto(`/collectivite/${collectivite.data.id}/plans/importer-ia`);
  await expect(
    page.getByRole('textbox', { name: 'Nom du plan' })
  ).toBeVisible();
  await expect(
    page.getByText(/L'import IA n'est pas disponible/)
  ).toBeVisible();
  await expect(page.getByTestId('ai-import.lancer')).toBeDisabled();
  const contact = page.getByRole('link', {
    name: 'contact@territoiresentransitions.fr',
  });
  await expect(contact).toHaveAttribute(
    'href',
    'mailto:contact@territoiresentransitions.fr'
  );
  await page.getByTestId('ai-import.plan-type').click();
  await page
    .getByRole('button', { name: PCAET_PLAN_TYPE_KEY.type, exact: true })
    .click();
  await expect(page.getByTestId('ai-import.lancer')).toBeDisabled();
  await expect(contact).toBeVisible();

  // Le parcours PCAET reprend la même décision, même si les flags UI sont actifs en CI.
  const demarche = new DemarchePcaetPom(page);
  await demarche.gotoCreatePage(collectivite.data.id);
  await demarche.createDemarche(collectivite.data.id);
  await demarche.gotoPlanActions();
  await demarche.importPlanButton.click();
  await expect(
    page.getByTestId('demarches.plan.request-plan-import-modal')
  ).toBeVisible();
  await expect(contact).toBeVisible();
  expect(mock.enqueueCalls).toBe(0);
});

test("affiche les détails dans le menu du plan seulement avec accès à l'import", async ({
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
  await expect(page.getByRole('link', { name: 'Nouvel import' })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Navigation des imports de plans' })
    .getByRole('link', { name: 'Plans', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Plans', exact: true })
  ).toBeVisible();
  // L'import est ouvert sans mode super-admin dès qu'un profil est disponible.
  await expect(
    page.getByRole('link', { name: 'Historique des imports', exact: true })
  ).toBeVisible();

  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/${manualPlanId}`
  );
  const loaded = page.waitForResponse((response) =>
    response.url().includes('plans.aiImport.listRecentAiImports')
  );
  await page.getByTestId('plans.plan.menu').click();
  await loaded;
  await expect(details).toHaveCount(0);
  expect(mock.queriedPlanIds).toContain(manualPlanId);

  const availableCapabilities = mock.capabilities;
  mock.capabilities = { profiles: [] };
  const queriesWithAccess = mock.queriedPlanIds.length;
  await page.goto(`/collectivite/${collectivite.data.id}/plans/${planId}`);
  await page.getByTestId('plans.plan.menu').click();
  await expect(
    page.getByRole('button', { name: 'Télécharger le plan (Excel)' })
  ).toBeVisible();
  await expect(details).toHaveCount(0);
  expect(mock.queriedPlanIds).toHaveLength(queriesWithAccess);
  mock.capabilities = availableCapabilities;

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
  await page.goto(`/collectivite/${collectivite.data.id}/plans/imports`);
  await expect(
    page.getByRole('heading', { name: 'Accès non autorisé' })
  ).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.historique')).toHaveCount(0);
  expect(mock.enqueueCalls).toBe(0);
  expect(mock.resumeCalls).toBe(0);
});

test('reprend un job depuis son compte rendu et attend done avant de proposer le plan', async ({
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
  await page
    .getByRole('link', { name: 'Voir le compte rendu', exact: true })
    .click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toBeVisible();
  await expect(page.getByTestId('plans.import-ia.etapes')).toHaveCount(0);
  await page.getByTestId('plans.import-ia.reprendre-button').click();
  await expect.poll(() => mock.resumeCalls).toBe(1);
  await expect(page.getByTestId('plans.import-ia.etapes')).toBeVisible();
  await expect(
    page.getByTestId('plans.import-ia.reprendre-button')
  ).toHaveCount(0);
  mock.status = { ...mock.status, createdPlanId: planId };
  const before = mock.statusCalls;
  await expect.poll(() => mock.statusCalls).toBeGreaterThan(before);
  await expect(page).toHaveURL(
    new RegExp(`/imports\\?importJobId=${mock.status.jobId}$`)
  );
  await expect(page.getByTestId('plans.import-ia.ouvrir-plan')).toHaveCount(0);
  mock.status = {
    ...mock.status,
    status: 'done',
    report: { issues: [], qualitativeReview: 'Plan à relire.' },
  };
  mock.recent = [mock.status];
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Plan à relire.'
  );
  await page.getByTestId('plans.import-ia.ouvrir-plan').click();
  await expect(page).toHaveURL(new RegExp(`/plans/${planId}$`));
  await page.getByTestId('plans.plan.menu').click();
  await page.getByRole('link', { name: 'Détails de l’import' }).click();
  await expect(page.getByTestId('plans.import-ia.rapport')).toContainText(
    'Plan à relire.'
  );
});

test('masque le plan incomplet depuis le détail d’un import en échec sur mobile', async ({
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
    report: {
      issues: [
        {
          kind: 'document-error',
          code: 'MISSING_INDICATEUR_YEAR',
          location:
            'Engagement "Le territoire accompagne la rénovation énergétique des logements sociaux" > Valeur chiffrée de l\'engagement',
          message: 'Renseignez une année de référence pour ce résultat.',
        },
      ],
      qualitativeReview: null,
    },
  };
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`
  );
  await expect(page.getByTestId('plans.import-ia.ouvrir-plan')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Nouvel import' })
  ).toBeInViewport();
  await expect(page.getByTestId('plans.import-ia.rapport')).toBeVisible();
  await expect(
    page.getByTestId('plans.import-ia.rapport').getByRole('listitem')
  ).toContainText('Renseignez une année de référence');
  const readingBox = await page
    .getByRole('group', { name: 'Lecture du document', exact: true })
    .boundingBox();
  const extractionBox = await page
    .getByRole('group', { name: 'Extraction des données', exact: true })
    .boundingBox();
  assert(readingBox && extractionBox);
  expect(extractionBox.y).toBeGreaterThanOrEqual(
    readingBox.y + readingBox.height
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  expect(mock.enqueueCalls).toBe(0);
  expect(mock.resumeCalls).toBe(0);
});

test('cache l’ouverture sans plan et affiche le motif dans le rapport', async ({
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
  await expect(
    page.getByRole('button', { name: 'Ouvrir le plan' })
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ouvrir le plan' })).toHaveCount(
    0
  );
  await expect(
    page.getByText('Aucun plan n’est associé à cet import.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nouvel import' })).toBeVisible();
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/importer-ia?importJobId=${mock.status.jobId}`
  );
  await expect(page.getByText('Import terminé', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/importer-ia\?importJobId=/);
  await expect(page.getByTestId('plans.import-ia.rapport')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Voir le compte rendu', exact: true })
  ).toHaveAttribute(
    'href',
    `/collectivite/${collectivite.data.id}/plans/imports?importJobId=${mock.status.jobId}`
  );
  await expect(page.getByRole('link', { name: 'Ouvrir le plan' })).toHaveCount(
    0
  );
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

test("rattache le plan PCAET même si la modale est fermée avant la réponse de l'envoi", async ({
  page,
  collectivites,
  plans,
}) => {
  const mock = new AiImportFixture();
  const release = mock.pauseEnqueueResponse();
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
    (type) =>
      type.categorie === PCAET_PLAN_TYPE_KEY.categorie &&
      type.type === PCAET_PLAN_TYPE_KEY.type
  );
  assert(pcaetType);
  const planId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Plan de test',
    typeId: pcaetType.id,
  });
  mock.status = { ...mock.status, profile: 'pcaet', createdPlanId: planId };
  const modal = page.getByTestId('demarches.plan.import-plan-modal');
  try {
    await submitImport(page);
    await expect.poll(() => mock.enqueuedForms.length).toBe(1);
    await page.getByTestId('close-demarches.plan.import-plan-modal').click();
    await expect(modal).not.toBeVisible();
  } finally {
    release();
  }
  await expect(page).toHaveURL(new RegExp(`importJobId=${mock.status.jobId}`));
  expect(mock.enqueuedForms[0].get('profile')).toBe('pcaet');
  expect(mock.enqueuedForms[0].get('planType')).toBe(String(pcaetType.id));
  await expect(
    page.getByTestId('demarches.plan.row').filter({ hasText: 'Plan de test' })
  ).toHaveAttribute('data-linked', 'true');
  await expect(modal).not.toBeVisible();
  await demarche.importPlanButton.click();
  await expect(
    modal.getByTestId('plans.import-ia.etapes-simplifiees')
  ).toBeVisible();
  await modal.getByTestId('demarches.plan.import-arriere-plan').click();
  mock.capabilities.profiles = [{ profile: 'pcaet', available: false }];
  await page.reload();
  await demarche.importPlanButton.click();
  await expect(page.getByTestId('plans.import-ia.suivi')).toBeVisible();
  mock.status = { ...mock.status, status: 'done' };
  mock.current = null;
  const finished = modal.getByTestId('demarches.plan.import-fini');
  await expect(finished).toBeVisible();
  await expect(
    finished.getByTestId('demarches.plan.import-fini.verifier')
  ).toHaveAttribute(
    'href',
    `/collectivite/${collectivite.data.id}/plans/${planId}?secteurs=liste`
  );
  await finished.getByRole('button', { name: 'Fermer', exact: true }).click();
  await expect(modal).not.toBeVisible();
  await expect(page).not.toHaveURL(/importJobId=/);
  await demarche.importPlanButton.click();
  await expect(
    page.getByTestId('demarches.plan.request-plan-import-modal')
  ).toBeVisible();
  expect(mock.enqueueCalls).toBe(1);
});

test('attend le type PCAET avant de lancer l’import du programme déposé', async ({
  page,
  baseURL,
  collectivites,
  plans,
}) => {
  const mock = new AiImportFixture();
  mock.status = { ...mock.status, profile: 'pcaet', withSecteurs: true };
  await mock.install(page);
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: supportUser,
  });
  const types = await user.getTrpcClient().plans.plans.listTypes.query();
  const pcaetType = types.find(
    (type) =>
      type.categorie === PCAET_PLAN_TYPE_KEY.categorie &&
      type.type === PCAET_PLAN_TYPE_KEY.type
  );
  assert(pcaetType);
  mock.status.createdPlanId = await plans.create(user, {
    collectiviteId: collectivite.data.id,
    nom: 'Programme importé',
    typeId: pcaetType.id,
  });
  let releasePlanTypes!: () => void;
  const pendingPlanTypes = new Promise<void>((resolve) => {
    releasePlanTypes = resolve;
  });
  let planTypesRequested = false;
  await page.route('**/trpc/plans.plans.listTypes*', async (route) => {
    planTypesRequested = true;
    await pendingPlanTypes;
    await route.fulfill({ json: { result: { data: types } } });
  });
  const document: DemarcheDocumentDepose = {
    id: 1,
    documentId: 'pcaet_plan_actions',
    etape: 'amont',
    commentaire: '',
    modifiedAt: '2026-01-01T10:00:00Z',
    modifiedBy: null,
    fichier: {
      id: 1,
      filename: 'programme.csv',
      hash: 'programme-test',
      bucketId: null,
      filesize: null,
    },
  };
  await page.route('**/trpc/demarches.pcaet.documents.list*', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.result.data.documents = [document];
    await route.fulfill({ response, json: body });
  });
  const downloadUrl = new URL('/programme-test.csv', baseURL).href;
  await page.route('**/trpc/collectivites.documents.getDownloadUrl*', (route) =>
    route.fulfill({
      json: {
        result: {
          data: { signedUrl: downloadUrl, filename: 'programme.csv' },
        },
      },
    })
  );
  await page.route(downloadUrl, (route) =>
    route.fulfill({
      contentType: 'text/csv',
      body: 'Axe,Action\nMobilité,Piste cyclable',
    })
  );
  try {
    const demarche = new DemarchePcaetPom(page);
    await demarche.gotoCreatePage(collectivite.data.id);
    await demarche.createDemarche(collectivite.data.id);
    await demarche.gotoDocuments();
    await page.goto(`${page.url()}?retryJobId=${randomUUID()}`);
    await page
      .getByTestId('demarches.pcaet.documents.proposer-import.creer')
      .click();
    await expect.poll(() => planTypesRequested).toBe(true);
    expect(mock.enqueueCalls).toBe(0);
    releasePlanTypes();
    await expect.poll(() => mock.enqueuedForms.length).toBe(1);
    const form = mock.enqueuedForms[0];
    expect(form.get('profile')).toBe('pcaet');
    expect(form.get('planType')).toBe(String(pcaetType.id));
    expect(form.get('origine')).toBe('etape_documents');
    await expect(page).not.toHaveURL(/retryJobId=/);
  } finally {
    releasePlanTypes();
  }
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

test("consulte un échec sans plan depuis l'historique et réserve la reprise à l'équipe", async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  mock.status = {
    ...mock.status,
    status: 'failed',
    resumable: true,
    stepStates: { ...mock.status.stepStates, reading: 'pending' },
  };
  mock.recent = [mock.status];
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  await page.goto(`/collectivite/${collectivite.data.id}/plans/imports`);
  await page.getByRole('button', { name: 'Plan de test', exact: true }).click();
  const report = page.getByTestId('plans.import-ia.rapport');
  await expect(report.getByRole('alert')).toContainText(
    'Réessayez avec le même document.'
  );
  await expect(
    report.getByRole('link', { name: 'Contacter le support' })
  ).toBeVisible();
  await expect(report).not.toContainText('Aucune remarque signalée.');
  await expect(
    report.getByRole('group', { name: 'Lecture du document', exact: true })
  ).toContainText('En échec');
  await expect(
    report.getByRole('group', { name: 'Extraction des données', exact: true })
  ).toContainText('Non commencée');
  await expect(
    page.getByTestId('plans.import-ia.reprendre-button')
  ).toHaveCount(0);
});

test("pose la question du niveau de l'action, envoie le choix et reprend le suivi", async ({
  page,
  collectivites,
}) => {
  const mock = new AiImportFixture();
  await mock.install(page);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  mock.status = {
    ...mock.status,
    status: 'awaiting_answer',
    question: actionLevelQuestion,
  };
  mock.current = mock.status;
  await page.goto(
    `/collectivite/${collectivite.data.id}/plans/importer-ia?importJobId=${mock.status.jobId}`
  );

  const question = page.getByTestId('plans.import-ia.question');
  await expect(question).toContainText(
    "Dans votre document, qu'est-ce qui est une action ?"
  );
  await expect(question).toContainText('Diagnostiquer et orienter');
  await expect(
    page.getByTestId('plans.import-ia.question.fiche')
  ).toBeChecked();
  await page.getByTestId('plans.import-ia.question.etape').check();
  await expect(question).toContainText(
    'environ 5 axes, 16 sous-axes et 54 actions'
  );
  await page.getByTestId('plans.import-ia.question.continuer').click();

  await expect
    .poll(() => mock.answers)
    .toEqual([{ kind: 'action-level', actionLevel: 'etape' }]);
  await expect(page.getByTestId('plans.import-ia.etapes')).toBeVisible();
  await expect(question).toHaveCount(0);
});
