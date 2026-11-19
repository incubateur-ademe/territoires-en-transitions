// Intervention ponctuelle sur preprod, isolée du code applicatif de la PR.
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { electrificationConfigSchema } = require('@tet/domain/plans');
const backend = (file) =>
  require(path.resolve(__dirname, '../../apps/backend/dist', file));
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
const SupabaseService = backend('utils/database/supabase.service.js').default;

class OperationError extends Error {}
function resultData(result, stage) {
  if (!result.success) throw new OperationError(`${stage}: ${JSON.stringify(result.error)}`);
  return result.data;
}

async function main() {
  if (process.env.PUBLICATION_TARGET !== 'preprod' || process.env.DATA_KIND !== 'catalogue' || process.env.SYNC_MODE !== 'verify') {
    throw new OperationError('Cette inspection exige preprod / catalogue / verify.');
  }
  const app = await NestFactory.createApplicationContext(SyncElectrificationDataModule, { logger: ['error', 'warn'] });
  try {
    const data = app.get(ElectrificationDataService);
    const selected = resultData(await data.getSelection('catalogue'), 'selection');
    if (!selected) throw new OperationError('Aucun catalogue actif à inspecter.');
    const objectPath = `catalogue/${electrificationStorageConfig.versionsDirectory}/${createHash('sha256').update(selected.version).digest('hex')}.json`;
    const downloaded = await app.get(SupabaseService).client.storage.from(electrificationStorageConfig.bucket).download(objectPath);
    if (downloaded.error || !downloaded.data) throw new OperationError('Lecture du catalogue actif impossible.');
    const active = JSON.parse(await downloaded.data.text());
    const parsed = electrificationConfigSchema.safeParse(active);
    console.log('CATALOGUE_INSPECTION', JSON.stringify({
      version: selected.version,
      revision: selected.revision,
      source: active.source,
      valid: parsed.success,
      issues: parsed.success ? [] : parsed.error.issues.map(({ path, code }) => ({ path: path.join('.'), code })),
      actions: active.fiches?.actions?.length ?? null,
    }));
    const actions = electrificationConfigSchema.shape.fiches.shape.actions.safeParse(active.fiches?.actions);
    if (!actions.success) throw new OperationError('Les actions existantes nécessitent une inspection avant remplacement.');
    const { indicateurReferenceSource, engagementReferenceSource } = electrificationGristConfig.catalogue;
    const references = await app.get(IndicateurReferenceExterneRepository).list([indicateurReferenceSource, engagementReferenceSource]);
    console.log('CATALOGUE_REFERENCES', JSON.stringify(references.filter(({ source }) => source === engagementReferenceSource).map(({ codeExterne, identifiantReferentiel, unite, periodicite }) => ({ codeExterne, identifiantReferentiel, unite, periodicite }))));
    const source = resultData(await app.get(ReadElectrificationGristService).read(references.map(({ lienSource }) => lienSource)), 'grist');
    const content = ElectrificationGristAdapter.build({
      source: source.data,
      sourceUrl: source.sourceUrl,
      indicateurReferences: references.filter(({ source }) => source === indicateurReferenceSource),
      engagementReferences: references.filter(({ source }) => source === engagementReferenceSource),
      previousActions: actions.data,
    });
    const candidate = { ...content, version: ElectrificationDataVersion.identify(content) };
    const validated = resultData(await app.get(ValidateElectrificationDataService).validate({ kind: 'catalogue', data: candidate }), 'validation');
    validated.data.version = ElectrificationDataVersion.identify(validated.data);
    console.log('CATALOGUE_CANDIDATE', JSON.stringify({
      status: 'verified',
      version: validated.data.version,
      sourceRevision: source.revision,
      engagements: validated.data.engagements.length,
      actions: validated.data.fiches.actions.length,
      targets: validated.data.engagements.flatMap(({ code, cibles }) => cibles.map(({ key, identifiantReferentiel, validation, unite, uniteImport }) => ({ code: `${code}.${key}`, identifiantReferentiel, validation, unite, uniteImport }))),
      retainedActionFields: actions.data.map(({ code, champs }) => ({ code, fields: Object.keys(champs).filter((field) => !['titre', 'description'].includes(field)) })).filter(({ fields }) => fields.length),
    }));
  } finally {
    await app.close();
  }
}
main().catch((error) => {
  console.error('OPERATION_FAILED', error instanceof OperationError ? error.message : 'UnexpectedFailure');
  process.exitCode = 1;
});
