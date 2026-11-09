import { ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { initGoogleCloudCredentials } from '@tet/backend/utils/google-sheets/gcloud.helper';
import { LlmCallEvent, LlmObserver } from '@tet/backend/utils/llm/llm-observer';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { electrificationConfig } from '@tet/domain/plans';
import { basename } from 'node:path';
import { InterpretElectrificationValues } from '../electrification/extract-plan/interpret-electrification-values';
import { AiPlanImportProfileEnum } from '../models/import-profile';
import { analyzeWorkbook } from '../pipeline/analyze-workbook/analyze-workbook';
import { computeLlmCallMetrics } from '../pipeline/compute-import-metrics';
import { ReadDocument } from '../pipeline/document/document-page';
import { buildLlmOcrPage } from '../pipeline/read-document/llm-ocr-page';
import { readDocument } from '../pipeline/read-document/read-document';
import { runImportPipeline } from '../pipeline/run-import-pipeline';
import { describeWorkbookAnalysis } from './describe-workbook-analysis';
import {
  buildEvalOutput,
  print,
  printEvalSummary,
  writeOutput,
} from './eval-output';
import { EvalModule } from './eval.module';
import type { EvalInput, GenericEvalInput } from './read-eval-input';

type ReportStep = (step: string) => void;
type EvalLlmContext = {
  llm: LlmService;
  events: LlmCallEvent[];
  provider: string;
  model: string | undefined;
  close: () => Promise<void>;
};

class CollectingLlmObserver extends LlmObserver {
  readonly events: LlmCallEvent[] = [];

  onCall(event: LlmCallEvent): void {
    this.events.push(event);
  }
}

export const evaluateImport = async (
  input: EvalInput,
  reportStep: ReportStep
): Promise<number> => {
  switch (input.mode) {
    case 'electrification':
      return evaluateElectrification(input, reportStep);
    case 'workbook':
      return printWorkbookAnalysis(input);
    case 'generic':
      return evaluateGenericImport(input, reportStep);
  }
};

/** Le parcours générique a besoin du fournisseur dès la lecture (OCR). */
const withEvalLlm = async <T>(
  evaluate: (context: EvalLlmContext) => Promise<T>
): Promise<T> => {
  const context = await createEvalLlm();
  try {
    return await evaluate(context);
  } finally {
    await context.close();
  }
};

const createEvalLlm = async (): Promise<EvalLlmContext> => {
  // Comme main.ts : Vertex utilise le compte de service du .env, pas le
  // compte gcloud personnel du poste.
  initGoogleCloudCredentials();
  const observer = new CollectingLlmObserver();
  const moduleRef = await Test.createTestingModule({ imports: [EvalModule] })
    // Garder visibles les réponses tronquées et les erreurs du fournisseur.
    .setLogger(new ConsoleLogger({ logLevels: ['error', 'warn'] }))
    .overrideProvider(LlmObserver)
    .useValue(observer)
    .compile();
  const app = moduleRef.createNestApplication();
  try {
    await app.init();
    const llm = app.get(LlmService);
    const config = app.get(ConfigurationService);
    const provider = config.get('LLM_PROVIDER');
    const model = llm.modelFor('strong');
    print(
      `⚠ Appels réels possibles à ${provider} (${model ?? 'modèle non défini'})`
    );
    return {
      llm,
      events: observer.events,
      provider,
      model,
      close: () => app.close(),
    };
  } catch (error) {
    await app.close();
    throw error;
  }
};

const evaluateGenericImport = async (
  input: GenericEvalInput,
  reportStep: ReportStep
): Promise<number> => {
  const output = await withEvalLlm(async ({ llm, events, provider, model }) => {
    const ocrPage = buildLlmOcrPage(llm);
    reportStep('lecture du document');
    const document = await readDocument(input, {
      ocr: ocrPage ? { ocrPage } : undefined,
    });
    if (!document.success) {
      print(`✗ Lecture impossible : ${JSON.stringify(document.error)}`);
      return null;
    }
    printDocumentStats(document.data);

    const startedAt = Date.now();
    const outcome = await runImportPipeline(llm, {
      document: document.data,
      ...input.options,
      disabledFields: [],
      // Sans base : l'étape des effets attendus et des secteurs saute.
      effetsAttendus: [],
      currentDate: new Date().toISOString(),
      onStepStatesChange: async (stepStates) => {
        const step = `pipeline ${JSON.stringify(stepStates)}, ${
          events.length
        } appel(s) au modèle`;
        reportStep(step);
        print(`  ${Math.round((Date.now() - startedAt) / 1000)} s · ${step}`);
      },
    });
    reportStep('écriture du résultat');
    return buildEvalOutput({
      input,
      outcome,
      events,
      durationMs: Date.now() - startedAt,
      provider,
      model,
    });
  });
  if (!output) return 1;

  const outPath = await writeOutput(output, {
    file: input.file,
    out: input.out,
    provider: output.provider,
  });
  printEvalSummary(output);
  print(`→ ${outPath}`);
  return output.status === 'done' ? 0 : 1;
};

const printDocumentStats = ({ stats, ocrFailures }: ReadDocument): void => {
  print(
    `Document : ${stats.pageCount} page(s), ${stats.textPages} lue(s), ${stats.ocrPages} transcrite(s), ${stats.emptyPages} vide(s)`
  );
  if (ocrFailures.length > 0) {
    print(
      `  OCR en échec sur ${
        ocrFailures.length
      } page(s), gardées telles quelles : ${ocrFailures
        .map((f) => `p${f.pageIndex + 1} (${f.reason})`)
        .join(', ')}`
    );
  }
};

/** Sans base ni worker : ce résultat ne qualifie pas la création du plan. */
const evaluateElectrification = async (
  input: Extract<EvalInput, { mode: 'electrification' }>,
  reportStep: ReportStep
): Promise<number> => {
  reportStep('lecture du document');
  const document = await readDocument(input);
  if (!document.success) {
    print(`✗ Lecture impossible : ${JSON.stringify(document.error)}`);
    return 1;
  }
  print(
    'Électrification : lecture déterministe et aide IA ciblée si nécessaire, sans résolution des références ni écriture.'
  );
  reportStep('extraction Électrification');
  const startedAt = Date.now();
  let contextPromise: Promise<EvalLlmContext> | undefined;
  let result: Awaited<ReturnType<typeof InterpretElectrificationValues.run>>;
  try {
    result = await InterpretElectrificationValues.run({
      document: document.data,
      catalogue: electrificationConfig,
      llm: {
        generateStructured: async (args) => {
          contextPromise ??= createEvalLlm();
          const { llm } = await contextPromise;
          return llm.generateStructured(args);
        },
      },
    });
  } finally {
    if (contextPromise) await (await contextPromise).close();
  }
  const context = await contextPromise;
  const provider = context?.provider ?? 'deterministic';
  const issues = result.success ? [] : result.error;
  const output = {
    file: basename(input.file),
    provider,
    model: context?.model,
    generatedAt: new Date().toISOString(),
    profile: AiPlanImportProfileEnum.ELECTRIFICATION,
    stage: 'extraction',
    referencesResolved: false,
    status: result.success ? 'done' : 'failed',
    checkpoint: result.success ? result.data : null,
    report: { issues, qualitativeReview: null },
    metrics: {
      ...computeLlmCallMetrics(context?.events ?? []),
      durationMs: Date.now() - startedAt,
    },
  };
  reportStep('écriture du résultat');
  const outPath = await writeOutput(output, {
    file: input.file,
    out: input.out,
    provider,
  });
  print(
    result.success
      ? 'Extraction terminée. Les références, le catalogue et les permissions restent à valider par le résolveur.'
      : '✗ Extraction Électrification en échec.'
  );
  for (const issue of issues) {
    print(
      `  ${issue.code} : ${issue.message}${
        issue.location ? ` (${issue.location})` : ''
      }`
    );
  }
  print(
    `Appels ${output.metrics.calls} · tokens ${
      output.metrics.tokens.totalTokens
    } · interprétations ${
      result.success ? result.data.interpretations.length : 0
    }`
  );
  print(`→ ${outPath}`);
  return result.success ? 0 : 1;
};

/** Avant tout module Nest ; sans option d'OCR, aucun modèle n'est appelé. */
const printWorkbookAnalysis = async (
  input: Extract<EvalInput, { mode: 'workbook' }>
): Promise<number> => {
  const read = await readDocument(input);
  if (!read.success) {
    print(`✗ Lecture impossible : ${JSON.stringify(read.error)}`);
    return 1;
  }
  const { workbook } = read.data;
  if (!workbook) {
    print('✗ --lecture-seule ne lit que les tableurs (xlsx, csv).');
    return 1;
  }
  describeWorkbookAnalysis(analyzeWorkbook(workbook)).forEach(print);
  return 0;
};
