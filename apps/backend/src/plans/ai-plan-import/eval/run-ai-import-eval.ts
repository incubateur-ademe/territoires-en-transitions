/**
 * Évalue l'import IA sur un document local, avec le fournisseur configuré.
 *
 * Réservé à un lancement humain : chaque exécution appelle le modèle pour de
 * vrai (cf. « Paid external AI calls » dans le CLAUDE.md racine).
 *
 *   make ai-import-eval f=plan.pdf [ref=eval-out/reference.json] [out=…]
 */
import { ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { initGoogleCloudCredentials } from '@tet/backend/utils/google-sheets/gcloud.helper';
import { LlmCallEvent, LlmObserver } from '@tet/backend/utils/llm/llm-observer';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { normalizeExtractedActions } from '../adapters/extracted-action-to-import-action';
import { detectSourceMimeType } from '../enqueue-import/detect-source-mime-type';
import { buildLlmOcrPage } from '../pipeline/read-document/llm-ocr-page';
import { readDocument } from '../pipeline/read-document/read-document';
import { runImportPipeline } from '../pipeline/run-import-pipeline';
import {
  compareWithManualReference,
  compareWithReference,
  computeEvalMetrics,
  EvalDiff,
  EvalMetrics,
  EvalRun,
  isManualReference,
  ManualReference,
  ManualReferenceDiff,
} from './eval-metrics';
import { EvalModule } from './eval.module';

const DECLARED_MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const USAGE = `Usage : run-ai-import-eval --file <pdf|xlsx|csv> [--out <json>] [--ref <json>]
  [--instructions "<consignes>"] [--no-verifications] [--no-sous-actions]`;

type EvalOutput = EvalRun & {
  file: string;
  provider: string;
  model: string | undefined;
  generatedAt: string;
  options: {
    instructions: string;
    withVerifications: boolean;
    withSousActions: boolean;
  };
  status: 'done' | 'failed';
  error: string | null;
  warnings: string[];
  stepStates: unknown;
  diff: EvalDiff | ManualReferenceDiff | null;
};

class CollectingLlmObserver extends LlmObserver {
  readonly events: LlmCallEvent[] = [];

  onCall(event: LlmCallEvent): void {
    this.events.push(event);
  }
}

const print = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

// Une promesse qui n'aboutit jamais vide la boucle d'évènements : Node sort
// alors en code 0 sans un mot. On veut au moins savoir où on en était.
let lastStep = 'démarrage';
let finished = false;
process.on('beforeExit', () => {
  if (!finished) {
    print(
      `✗ Arrêt avant la fin : plus rien n'attend de réponse (dernière étape : ${lastStep}).`
    );
    process.exitCode = 1;
  }
});
process.on('unhandledRejection', (reason) => {
  print(
    `✗ Rejet non traité : ${
      reason instanceof Error ? reason.stack : String(reason)
    }`
  );
  process.exitCode = 1;
});

const main = async (): Promise<number> => {
  const { values } = parseArgs({
    options: {
      file: { type: 'string' },
      out: { type: 'string' },
      ref: { type: 'string' },
      instructions: { type: 'string', default: '' },
      'no-verifications': { type: 'boolean', default: false },
      'no-sous-actions': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help || !values.file) {
    print(USAGE);
    return values.help ? 0 : 1;
  }

  const buffer = await readFile(values.file);
  const declaredMime =
    DECLARED_MIME_BY_EXTENSION[extname(values.file).toLowerCase()] ?? '';
  const mimeType = detectSourceMimeType(buffer, declaredMime);
  if (mimeType === null) {
    print(`✗ Format non supporté : ${values.file}`);
    return 1;
  }
  // Lue avant le premier appel payant : une référence illisible arrête tout.
  const reference = values.ref
    ? (JSON.parse(await readFile(values.ref, 'utf-8')) as
        | EvalRun
        | ManualReference)
    : null;

  // Comme main.ts : Vertex s'authentifie avec le compte de service du .env,
  // pas avec les identifiants gcloud personnels du poste.
  initGoogleCloudCredentials();
  const observer = new CollectingLlmObserver();
  // Le logger de test de Nest n'affiche rien : on veut voir les avertissements
  // (réponse tronquée) et les erreurs d'Albert.
  const moduleRef = await Test.createTestingModule({ imports: [EvalModule] })
    .setLogger(new ConsoleLogger({ logLevels: ['error', 'warn'] }))
    .overrideProvider(LlmObserver)
    .useValue(observer)
    .compile();
  const app = await moduleRef.createNestApplication().init();
  const llm = app.get(LlmService);
  const config = app.get(ConfigurationService);
  const provider = config.get('LLM_PROVIDER');
  const model =
    provider === 'albert'
      ? config.get('ALBERT_MODEL')
      : config.get('GEMINI_MODEL');

  print(`⚠ Appel réel à ${provider} (${model ?? 'modèle non défini'})`);

  const ocrPage = buildLlmOcrPage(llm);
  lastStep = 'lecture du document';
  const document = await readDocument(
    { buffer, mimeType },
    { ocr: ocrPage ? { ocrPage } : undefined }
  );
  if (!document.success) {
    print(`✗ Lecture impossible : ${JSON.stringify(document.error)}`);
    await app.close();
    return 1;
  }
  const { stats } = document.data;
  print(
    `Document : ${stats.pageCount} page(s), ${stats.textPages} lue(s), ${stats.ocrPages} transcrite(s), ${stats.emptyPages} vide(s)`
  );
  if (document.data.ocrFailures.length > 0) {
    print(
      `  OCR en échec sur ${
        document.data.ocrFailures.length
      } page(s), gardées telles quelles : ${document.data.ocrFailures
        .map((f) => `p${f.pageIndex + 1} (${f.reason})`)
        .join(', ')}`
    );
  }

  const options = {
    instructions: values.instructions,
    withVerifications: !values['no-verifications'],
    withSousActions: !values['no-sous-actions'],
  };
  const startedAt = Date.now();
  const outcome = await runImportPipeline(llm, {
    document: document.data,
    ...options,
    disabledFields: [],
    currentDate: new Date().toISOString(),
    onStepStatesChange: async (stepStates) => {
      lastStep = `pipeline ${JSON.stringify(stepStates)}, ${
        observer.events.length
      } appel(s) au modèle`;
      print(`  ${Math.round((Date.now() - startedAt) / 1000)} s · ${lastStep}`);
    },
  });
  const durationMs = Date.now() - startedAt;
  lastStep = 'écriture du résultat';
  await app.close();

  // Un import en échec rend les actions d'avant l'étape fautive : on les
  // mesure quand même, c'est ce qui dit pourquoi l'étape a échoué.
  // Mesuré tel que le plan sera créé : titres sans numéro, axes unifiés.
  const pipelineDraft =
    outcome.status === 'done' ? outcome.draft : outcome.partialDraft;
  const draft = {
    ...pipelineDraft,
    actions: normalizeExtractedActions(pipelineDraft.actions).actions,
  };
  const metrics = computeEvalMetrics({
    draft,
    events: observer.events,
    durationMs,
  });
  const diff =
    reference === null
      ? null
      : isManualReference(reference)
      ? compareWithManualReference({ draft, metrics }, reference)
      : compareWithReference({ draft, metrics }, reference);

  const output: EvalOutput = {
    file: basename(values.file),
    provider,
    model,
    generatedAt: new Date().toISOString(),
    options,
    status: outcome.status,
    error:
      outcome.status === 'failed'
        ? `${outcome.failedStep}: ${outcome.error.kind}`
        : null,
    stepStates: outcome.stepStates,
    warnings: outcome.warnings,
    metrics,
    draft,
    diff,
  };
  const outPath =
    values.out ??
    join(
      'eval-out',
      `${basename(
        values.file,
        extname(values.file)
      )}-${provider}-${Date.now()}.json`
    );
  await mkdir(join(outPath, '..'), { recursive: true });
  await writeFile(outPath, JSON.stringify(output, null, 2));

  printMetrics(metrics, output.status, output.error);
  for (const warning of output.warnings) {
    print(`  ⚠ ${warning}`);
  }
  if (diff) {
    if ('deltas' in diff) {
      printDiff(diff);
    } else {
      printManualDiff(diff);
    }
  }
  print(`→ ${outPath}`);
  finished = true;
  return outcome.status === 'done' ? 0 : 1;
};

const printMetrics = (
  metrics: EvalMetrics,
  status: string,
  error: string | null
): void => {
  print(`Statut : ${status}${error ? ` (${error})` : ''}`);
  print(
    `Actions ${metrics.actions} (sans axe ${metrics.actionsSansAxe}) · axes ${metrics.axes} · sous-axes ${metrics.sousAxes} · sous-actions ${metrics.sousActions}`
  );
  print(
    `Remplissage : ${Object.entries(metrics.fillRates)
      .map(([field, rate]) => `${field} ${Math.round(rate * 100)} %`)
      .join(', ')}`
  );
  print(
    `Appels ${metrics.calls} (429 : ${metrics.rateLimited}, échecs : ${
      metrics.failedCalls
    }) · tokens ${metrics.tokens.totalTokens} (entrée ${
      metrics.tokens.promptTokens
    }) · durée ${Math.round(metrics.durationMs / 1000)} s`
  );
};

const printDiff = (diff: EvalDiff): void => {
  const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
  print(
    `Écarts vs référence : ${Object.entries(diff.deltas)
      .filter(([key]) => key !== 'durationMs')
      .map(([key, delta]) => `${key} ${signed(delta)}`)
      .join(', ')}`
  );
  print(
    `Titres de la référence introuvables : ${diff.missingTitles.length}${
      diff.missingTitles.length > 0
        ? `\n  - ${diff.missingTitles.slice(0, 30).join('\n  - ')}`
        : ''
    }`
  );
  print(`Titres en trop : ${diff.extraTitles.length}`);
};

const printManualDiff = (diff: ManualReferenceDiff): void => {
  const list = (titles: string[]) =>
    titles.length > 0 ? `\n  - ${titles.slice(0, 30).join('\n  - ')}` : '';
  print(
    `Structure attendue : axes ${diff.axes.actual}/${diff.axes.expected}, actions retrouvées ${diff.actions.found}/${diff.actions.expected} (${diff.actions.actual} extraites)`
  );
  if (diff.axes.missing.length > 0) {
    print(
      `Axes introuvables : ${diff.axes.missing.length}${list(
        diff.axes.missing
      )}`
    );
  }
  print(
    `Actions introuvables : ${diff.missingTitles.length}${list(
      diff.missingTitles
    )}`
  );
  if (diff.titlesFoundAsSousAxe.length > 0) {
    print(
      `… dont retrouvées en sous-axe (niveau inventé) : ${
        diff.titlesFoundAsSousAxe.length
      }${list(diff.titlesFoundAsSousAxe)}`
    );
  }
  print(
    `Actions sous un autre axe : ${diff.misplacedTitles.length}${list(
      diff.misplacedTitles.map(
        (m) =>
          `${m.titre} (attendu : ${m.expectedAxe} ; obtenu : ${m.actualAxe})`
      )
    )}`
  );
  print(`Titres en trop : ${diff.extraTitles.length}${list(diff.extraTitles)}`);
};

// Pas de process.exit : il tronque ce qui reste à écrire sur la sortie.
main().then(
  (code) => {
    finished = true;
    process.exitCode = code;
  },
  (error: unknown) => {
    finished = true;
    print(
      `✗ ${
        error instanceof Error ? error.stack ?? error.message : String(error)
      }`
    );
    process.exitCode = 1;
  }
);
