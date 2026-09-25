import { DisableableField } from '../models/disableable-field';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { joinPages, ReadDocument } from './document/document-page';
import { splitDocument } from './split-document/split-document';
import {
  emptyTokenUsage,
  sumTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { ExtractedAction } from '../models/extracted-action';
import { PlanDraft } from '../models/plan-draft';
import { consolidateActions } from './consolidate-actions/consolidate-actions';
import { enrichSousActions } from './enrich-sous-actions/enrich-sous-actions';
import {
  ExtractActionsError,
  extractActions,
} from './extract-actions/extract-actions';
import { reviewQuality } from './qualitative-review/qualitative-review';
import { scoreActions } from './score-actions/score-actions';
import { SourceChunks } from './source-chunks/source-chunks';

const stepStateSchema = z.enum(['ok', 'skipped', 'pending']);

// Les étapes ajoutées après coup ont un défaut : les jobs déjà en base n'en
// ont pas la trace, et le routeur de statut valide ce qu'il lit.
export const stepStatesSchema = z.object({
  reading: stepStateSchema.default('skipped'),
  scouting: stepStateSchema.default('skipped'),
  extraction: stepStateSchema,
  hierarchy: stepStateSchema.default('skipped'),
  scoring: stepStateSchema,
  consolidation: stepStateSchema,
  enrichment: stepStateSchema,
  qualitativeReview: stepStateSchema,
});

export type StepState = z.infer<typeof stepStateSchema>;

export type StepStates = z.infer<typeof stepStatesSchema>;

export type StepName = keyof StepStates;

export type ReadingError = {
  kind: 'document_too_long';
  chunks: number;
  maxChunks: number;
};

export type PipelineError = ExtractActionsError | ReadingError;

export type PipelineLlm = Pick<
  LlmService,
  'generateStructured' | 'maxInputTokens' | 'capabilities'
>;

/** Reprise d'une tranche à l'autre, pour ne pas couper une action en deux. */
const CHUNK_OVERLAP_TOKENS = 1_500;
/**
 * Garde-fou de coût : au-delà, ce n'est plus un plan d'action. Avec Albert,
 * 10 tranches font environ 600 000 tokens, soit plusieurs centaines de pages.
 */
export const MAX_DOCUMENT_CHUNKS = 10;

export type RunImportPipelineInput = {
  document: ReadDocument;
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
  withVerifications: boolean;
  withSousActions: boolean;
  signal?: AbortSignal;
  onStepStatesChange?: (stepStates: Readonly<StepStates>) => Promise<void>;
};

export type PipelineOutcome =
  | {
      status: 'done';
      draft: PlanDraft;
      stepStates: StepStates;
      tokens: TokenUsage;
    }
  | {
      status: 'failed';
      failedStep: StepName;
      error: PipelineError;
      stepStates: StepStates;
      tokens: TokenUsage;
    };

type Progress = {
  actions: ExtractedAction[];
  review: string | null;
  tokens: TokenUsage;
  stepStates: StepStates;
};

type StepProduce = {
  actions?: ExtractedAction[];
  review?: string;
  tokens: TokenUsage;
};

type StepGo =
  | { success: true; progress: Progress }
  | { success: false; outcome: PipelineOutcome };

export const runImportPipeline = async (
  llm: PipelineLlm,
  input: RunImportPipelineInput
): Promise<PipelineOutcome> => {
  const reportProgress = (stepStates: StepStates): Promise<void> =>
    input.onStepStatesChange?.(stepStates) ?? Promise.resolve();

  const read = readChunks(llm, input.document);
  if (!read.success) {
    return failed(initialProgress(), 'reading', read.error);
  }
  const chunks = read.data;
  // Le repérage arrive avec la stratégie segmentée ; d'ici là, rien à trier.
  const afterReading = markSkipped(
    markOk(initialProgress(), 'reading'),
    'scouting'
  );
  await reportProgress(afterReading.stepStates);

  // Les étapes suivantes conservent l'ordre des actions : la tranche d'origine
  // relevée à l'extraction reste valable pour elles.
  let source: SourceChunks = { chunks, chunkIndexByAction: [] };
  const extracted = await runStep({
    progress: afterReading,
    name: 'extraction',
    run: async () => {
      const result = await extractActions(llm, {
        chunks,
        instructions: input.instructions,
        disabledFields: input.disabledFields,
        currentDate: input.currentDate,
        signal: input.signal,
      });
      if (result.success) {
        source = {
          chunks,
          chunkIndexByAction: result.data.chunkIndexByAction,
        };
      }
      return result;
    },
  });
  if (!extracted.success) return extracted.outcome;
  // La mise en cohérence des axes arrive avec la stratégie segmentée.
  const afterExtraction = markSkipped(extracted.progress, 'hierarchy');
  await reportProgress(afterExtraction.stepStates);

  const scored = await runStep({
    progress: afterExtraction,
    name: 'scoring',
    skipWhen: !input.withVerifications,
    run: (actions) =>
      scoreActions(llm, { actions, source, signal: input.signal }),
  });
  if (!scored.success) return scored.outcome;
  await reportProgress(scored.progress.stepStates);

  const consolidated = await runStep({
    progress: scored.progress,
    name: 'consolidation',
    skipWhen: !input.withVerifications,
    run: (actions) =>
      consolidateActions(llm, {
        actions,
        source,
        disabledFields: input.disabledFields,
        signal: input.signal,
      }),
  });
  if (!consolidated.success) return consolidated.outcome;
  await reportProgress(consolidated.progress.stepStates);

  const enriched = await runStep({
    progress: consolidated.progress,
    name: 'enrichment',
    skipWhen: !input.withSousActions,
    onSkip: clearSousActions,
    run: (actions) =>
      enrichSousActions(llm, {
        actions,
        source,
        disabledFields: input.disabledFields,
        signal: input.signal,
      }),
  });
  if (!enriched.success) return enriched.outcome;
  await reportProgress(enriched.progress.stepStates);

  const reviewed = await runStep({
    progress: enriched.progress,
    name: 'qualitativeReview',
    run: (actions) => reviewQuality(llm, { actions, signal: input.signal }),
  });
  if (!reviewed.success) return reviewed.outcome;
  await reportProgress(reviewed.progress.stepStates);

  return done(reviewed.progress);
};

type RunStepArgs = {
  progress: Progress;
  name: StepName;
  run: (
    actions: ExtractedAction[]
  ) => Promise<Result<StepProduce, PipelineError>>;
  skipWhen?: boolean;
  onSkip?: (progress: Progress) => Progress;
};

const runStep = async ({
  progress,
  name,
  run,
  skipWhen = false,
  onSkip,
}: RunStepArgs): Promise<StepGo> => {
  if (skipWhen) {
    const skipped = onSkip ? onSkip(progress) : progress;
    return { success: true, progress: markSkipped(skipped, name) };
  }
  const result = await run(progress.actions);
  if (!result.success) {
    return { success: false, outcome: failed(progress, name, result.error) };
  }
  return {
    success: true,
    progress: mergeStepResult(progress, name, result.data),
  };
};

const mergeStepResult = (
  progress: Progress,
  name: StepName,
  produce: StepProduce
): Progress => ({
  actions: produce.actions ?? progress.actions,
  review: produce.review ?? progress.review,
  tokens: sumTokenUsage([progress.tokens, produce.tokens]),
  stepStates: { ...progress.stepStates, [name]: 'ok' },
});

const markSkipped = (progress: Progress, name: StepName): Progress => ({
  ...progress,
  stepStates: { ...progress.stepStates, [name]: 'skipped' },
});

const markOk = (progress: Progress, name: StepName): Progress => ({
  ...progress,
  stepStates: { ...progress.stepStates, [name]: 'ok' },
});

/** Le texte des pages, en tranches que le modèle accepte. */
const readChunks = (
  llm: PipelineLlm,
  document: ReadDocument
): Result<string[], ReadingError> => {
  const text = joinPages(document);
  const chunks = splitDocument(text, {
    maxTokens: llm.maxInputTokens,
    overlapTokens: CHUNK_OVERLAP_TOKENS,
    header: document.kind === 'pdf' ? undefined : text.split('\n', 1)[0],
  });
  if (chunks.length > MAX_DOCUMENT_CHUNKS) {
    return failure({
      kind: 'document_too_long',
      chunks: chunks.length,
      maxChunks: MAX_DOCUMENT_CHUNKS,
    });
  }
  return success(chunks);
};

const clearSousActions = (progress: Progress): Progress => ({
  ...progress,
  actions: progress.actions.map((action) => ({ ...action, sousActions: [] })),
});

const failed = (
  progress: Progress,
  failedStep: StepName,
  error: PipelineError
): PipelineOutcome => ({
  status: 'failed',
  failedStep,
  error,
  stepStates: progress.stepStates,
  tokens: progress.tokens,
});

const done = (progress: Progress): PipelineOutcome => ({
  status: 'done',
  draft: { actions: progress.actions, qualitativeReview: progress.review },
  stepStates: progress.stepStates,
  tokens: progress.tokens,
});

export const initialStepStates = (): StepStates => ({
  reading: 'pending',
  scouting: 'pending',
  extraction: 'pending',
  hierarchy: 'pending',
  scoring: 'pending',
  consolidation: 'pending',
  enrichment: 'pending',
  qualitativeReview: 'pending',
});

const initialProgress = (): Progress => ({
  actions: [],
  review: null,
  tokens: emptyTokenUsage(),
  stepStates: initialStepStates(),
});
