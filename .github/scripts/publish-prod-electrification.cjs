// Opération ponctuelle de publication en production, hors code applicatif.
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { eq } = require('drizzle-orm');
const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const path = require('node:path');
const { electrificationConfigSchema } = require('@tet/domain/plans');
const backend = (file) => require(path.resolve(__dirname, '../../apps/backend/dist', file));
const root = 'plans/plans/electrification';
const { SyncElectrificationDataModule } = backend(`${root}/sync-electrification-data/sync-electrification-data.module.js`);
const { ElectrificationDataService } = backend(`${root}/publish-electrification-data/electrification-data.service.js`);
const { ValidateElectrificationDataService } = backend(`${root}/publish-electrification-data/validate-electrification-data.service.js`);
const { ReadElectrificationGristService } = backend(`${root}/publish-electrification-data/sources/read-electrification-grist.service.js`);
const { ElectrificationGristAdapter } = backend(`${root}/publish-electrification-data/sources/electrification-grist.adapter.js`);
const { ElectrificationDataVersion } = backend(`${root}/publish-electrification-data/electrification-data-version.rules.js`);
const { electrificationStorageConfig } = backend(`${root}/config/electrification-storage.config.js`);
const { electrificationGristConfig } = backend(`${root}/config/electrification-grist.config.js`);
const { IndicateurReferenceExterneRepository } = backend('indicateurs/indicateur/indicateur-reference-externe.repository.js');
const { indicateurDefinitionTable } = backend('indicateurs/indicateur/indicateur-definition.table.js');
const { DatabaseService } = backend('utils/database/database.service.js');
const SupabaseService = backend('utils/database/supabase.service.js').default;

class OperationError extends Error {}
function resultData(result, stage) {
  if (!result.success) throw new OperationError(`${stage}: ${JSON.stringify(result.error)}`);
  return result.data;
}
function report(stage, value) {
  console.log(stage, JSON.stringify(value));
}
async function endpoint(endpointPath) {
  const origin = new URL(process.env.CATALOGUE_BACKEND_URL);
  if (origin.href !== 'https://api.territoiresentransitions.fr/') throw new OperationError('Backend prod inattendu.');
  const response = await fetch(new URL(endpointPath, origin), {
    headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(180000),
  });
  const body = await response.json();
  if (!response.ok) throw new OperationError(`${endpointPath}: HTTP ${response.status}, ${JSON.stringify(body.message ?? body.error ?? 'requête refusée')}`);
  return body;
}

async function main() {
  if (process.env.PUBLICATION_TARGET !== 'prod' || process.env.DATA_KIND !== 'catalogue' || process.env.SYNC_MODE !== 'verify') {
    throw new OperationError('Cette inspection exige prod / catalogue / verify.');
  }
  const deployed = await endpoint('/version');
  report('BACKEND_DEPLOYED', deployed);
  if (deployed.environment !== 'prod' || deployed.commit !== 'cc954ea55') throw new OperationError('Révision du backend inattendue.');
  const verified = await endpoint('/api/v1/indicateur-definitions/verify');
  if (verified.ok !== true) throw new OperationError('La vérification des indicateurs a échoué.');
  report('INDICATEURS_VERIFIED', verified);
  const app = await NestFactory.createApplicationContext(SyncElectrificationDataModule, { logger: ['error', 'warn'] });
  try {
    const db = app.get(DatabaseService).db;
    const definitions = await db.select({ version: indicateurDefinitionTable.version }).from(indicateurDefinitionTable).where(eq(indicateurDefinitionTable.identifiantReferentiel, 'cae_1.a'));
    if (definitions.length !== 1) throw new OperationError('Version des indicateurs introuvable.');
    report('INDICATEURS_CURRENT', definitions[0]);
    const data = app.get(ElectrificationDataService);
    const selected = resultData(await data.getSelection('catalogue'), 'sélection');
    let previousActions = [];
    if (selected) {
      const objectPath = `catalogue/${electrificationStorageConfig.versionsDirectory}/${createHash('sha256').update(selected.version).digest('hex')}.json`;
      const downloaded = await app.get(SupabaseService).client.storage.from(electrificationStorageConfig.bucket).download(objectPath);
      if (downloaded.error || !downloaded.data) throw new OperationError('Lecture du catalogue actif impossible.');
      const active = JSON.parse(await downloaded.data.text());
      const parsed = electrificationConfigSchema.safeParse(active);
      report('CATALOGUE_CURRENT', {
        version: selected.version, revision: selected.revision, source: active.source, valid: parsed.success,
        issues: parsed.success ? [] : parsed.error.issues.map(({ path, code }) => ({ path: path.join('.'), code })),
        actions: active.fiches?.actions?.length ?? null,
      });
      const actions = electrificationConfigSchema.shape.fiches.shape.actions.safeParse(active.fiches?.actions);
      if (!actions.success || !isDeepStrictEqual(actions.data, active.fiches.actions)) throw new OperationError('Les champs des actions existantes nécessitent une inspection.');
      previousActions = actions.data;
    } else {
      report('CATALOGUE_CURRENT', { version: null, revision: null });
    }
    const { indicateurReferenceSource, engagementReferenceSource } = electrificationGristConfig.catalogue;
    const references = await app.get(IndicateurReferenceExterneRepository).list([indicateurReferenceSource, engagementReferenceSource]);
    report('REFERENCES_CURRENT', { count: references.length, versions: [...new Set(references.map(({ version }) => version))], engagements: references.filter(({ source }) => source === engagementReferenceSource).map(({ codeExterne, identifiantReferentiel, unite, periodicite }) => ({ codeExterne, identifiantReferentiel, unite, periodicite })) });
    const source = resultData(await app.get(ReadElectrificationGristService).read(references.map(({ lienSource }) => lienSource)), 'Grist');
    const content = ElectrificationGristAdapter.build({
      source: source.data, sourceUrl: source.sourceUrl,
      indicateurReferences: references.filter(({ source }) => source === indicateurReferenceSource),
      engagementReferences: references.filter(({ source }) => source === engagementReferenceSource),
      previousActions,
    });
    const candidate = { ...content, version: ElectrificationDataVersion.identify(content) };
    const validated = resultData(await app.get(ValidateElectrificationDataService).validate({ kind: 'catalogue', data: candidate }), 'validation');
    validated.data.version = ElectrificationDataVersion.identify(validated.data);
    report('CATALOGUE_CANDIDATE', {
      version: validated.data.version, sourceRevision: source.revision,
      engagements: validated.data.engagements.length, actions: validated.data.fiches.actions.length,
      targets: validated.data.engagements.flatMap(({ code, cibles }) => cibles.map(({ key, identifiantReferentiel, validation, unite, uniteImport }) => ({ code: `${code}.${key}`, identifiantReferentiel, validation, unite, uniteImport }))),
      retainedActionFields: previousActions.map(({ code, champs }) => ({ code, fields: Object.keys(champs).filter((field) => !['titre', 'description'].includes(field)) })).filter(({ fields }) => fields.length),
    });
  } finally {
    await app.close();
  }
}
main().catch((error) => {
  console.error('OPERATION_FAILED', error instanceof OperationError ? error.message : 'UnexpectedFailure');
  process.exitCode = 1;
});
