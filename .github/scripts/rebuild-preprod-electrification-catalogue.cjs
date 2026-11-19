// Intervention ponctuelle sur preprod, isolée du code applicatif de la PR.
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const path = require('node:path');
const { electrificationConfigSchema } = require('@tet/domain/plans');
const backend = (file) =>
  require(path.resolve(__dirname, '../../apps/backend/dist', file));
const root = 'plans/plans/electrification';
const { SyncElectrificationDataModule } = backend(`${root}/sync-electrification-data/sync-electrification-data.module.js`);
const { SyncElectrificationDataService } = backend(`${root}/sync-electrification-data/sync-electrification-data.service.js`);
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

async function indicateurEndpoint(action) {
  const origin = new URL(process.env.CATALOGUE_BACKEND_URL);
  if (origin.href !== 'https://preprod-api.territoiresentransitions.fr/') throw new OperationError('Backend preprod inattendu.');
  const response = await fetch(new URL(`/api/v1/indicateur-definitions/${action}`, origin), {
    headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(180000),
  });
  const body = await response.json();
  if (!response.ok) throw new OperationError(`indicateurs ${action}: HTTP ${response.status}, ${JSON.stringify(body.message ?? body.error ?? 'publication refusée')}`);
  console.log('INDICATEURS_PUBLICATION', JSON.stringify({ action, ok: body.ok, definitions: body.definitions?.length, recalculated: body.identifiantsRecalcules?.length }));
  return body;
}

async function main() {
  if (process.env.PUBLICATION_TARGET !== 'preprod' || process.env.DATA_KIND !== 'catalogue' || !['verify', 'publish'].includes(process.env.SYNC_MODE)) {
    throw new OperationError('Cette intervention exige preprod / catalogue / verify ou publish.');
  }
  const app = await NestFactory.createApplicationContext(SyncElectrificationDataModule, { logger: ['error', 'warn'] });
  try {
    const data = app.get(ElectrificationDataService);
    const selected = resultData(await data.getSelection('catalogue'), 'selection');
    if (!selected) throw new OperationError('Aucun catalogue actif à inspecter.');
    if (process.env.SYNC_MODE === 'publish' && (selected.version !== 'sha256-ad31e14b97e3bcfba6ea0bc0b66cc810ef944483b90395d19e1ffd3be9325bc2' || selected.revision !== '4a7f0daf-649b-44fd-8c95-f4ec6cad8f63')) {
      throw new OperationError('La sélection a changé depuis son inspection.');
    }
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
    if (!isDeepStrictEqual(actions.data, active.fiches.actions)) throw new OperationError('Des champs existants seraient modifiés par la validation.');
    if (process.env.SYNC_MODE === 'publish') {
      const verified = await indicateurEndpoint('verify');
      if (verified.ok !== true) throw new OperationError('La vérification des indicateurs a échoué.');
      const imported = await indicateurEndpoint('import');
      if (!Array.isArray(imported.definitions) || !imported.definitions.length) throw new OperationError('Résultat de publication des indicateurs inattendu.');
    }
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
    if (process.env.SYNC_MODE === 'publish') {
      const targets = validated.data.engagements.flatMap(({ cibles }) => cibles);
      if (targets.some(({ validation }) => validation !== 'validated')) throw new OperationError('Des correspondances restent en attente.');
      const beforeWrite = resultData(await data.getSelection('catalogue'), 'selection avant publication');
      if (beforeWrite?.revision !== selected.revision) throw new OperationError('Publication concurrente détectée.');
      const context = {
        publishedBy: `github:${process.env.GITHUB_ACTOR}`,
        sourceRevision: source.revision,
        workflowRun: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
      };
      const published = resultData(await data.publish('catalogue', validated.data, context), 'publication');
      console.log('CATALOGUE_PUBLICATION', JSON.stringify({ status: 'published', version: published.version, validatedTargets: targets.length }));
      const readBack = resultData(await data.getCatalogue(), 'relecture');
      if (!isDeepStrictEqual(readBack, validated.data)) throw new OperationError('La relecture diffère du contenu validé.');
      const checked = resultData(await app.get(SyncElectrificationDataService).sync('catalogue', false, context), 'synchronisation standard');
      if (checked.version !== published.version) throw new OperationError('La source a changé après publication.');
      console.log('CATALOGUE_STANDARD_SYNC', JSON.stringify(checked));
    }
  } finally {
    await app.close();
  }
}
main().catch((error) => {
  console.error('OPERATION_FAILED', error instanceof OperationError ? error.message : 'UnexpectedFailure');
  process.exitCode = 1;
});
