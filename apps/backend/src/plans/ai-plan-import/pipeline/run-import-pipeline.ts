import { DisableableField } from '../models/disableable-field';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import {
  isTabularKind,
  joinPages,
  ReadDocument,
} from './document/document-page';
import { structureUnits } from './extract-actions/structure-units';
import { consolidateHierarchy } from './consolidate-hierarchy/consolidate-hierarchy';
import { PlanSkeleton } from '../models/plan-skeleton';
import { scoutUnits } from './scout-units/scout-units';
import { DocumentUnit } from './segment-document/document-unit';
import { segmentDocument } from './segment-document/segment-document';
import { coalesceChunks } from './source-chunks/coalesce-chunks';
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
/** Même garde-fou pour la stratégie segmentée, à la maille de la fiche. */
export const MAX_DOCUMENT_UNITS = 300;
/**
 * Les vérifications relisent des fenêtres d'unités adjacentes : elles n'ont
 * pas besoin de la finesse d'une fiche, et un appel par fiche coûterait cher.
 */
const VERIFICATION_WINDOW_TOKENS = 12_000;

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
      /** Ce qui a été écarté en route sans faire échouer l'import. */
      warnings: string[];
      stepStates: StepStates;
      tokens: TokenUsage;
    }
  | {
      status: 'failed';
      failedStep: StepName;
      error: PipelineError;
      /** Les actions telles qu'avant l'étape en échec : de quoi comprendre. */
      partialDraft: PlanDraft;
      warnings: string[];
      stepStates: StepStates;
      tokens: TokenUsage;
    };

type Progress = {
  actions: ExtractedAction[];
  review: string | null;
  tokens: TokenUsage;
  stepStates: StepStates;
  warnings: string[];
};

type StepProduce = {
  actions?: ExtractedAction[];
  review?: string;
  tokens: TokenUsage;
  warnings?: string[];
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

  const read = readSource(llm, input.document);
  if (!read.success) {
    return failed(initialProgress(), 'reading', read.error);
  }
  let { chunks } = read.data;
  let { units } = read.data;
  let skeleton: PlanSkeleton | null = null;
  const afterReading = markOk(initialProgress(), 'reading');
  await reportProgress(afterReading.stepStates);

  // Écarter ce qui ne contient pas d'action et relever le squelette du plan :
  // seulement quand le document est lu par unités.
  const scouted = await runStep({
    progress: afterReading,
    name: 'scouting',
    skipWhen: units === null,
    run: async () => {
      const result = await scoutUnits(llm, {
        units: units as DocumentUnit[],
        signal: input.signal,
      });
      if (!result.success) {
        return result;
      }
      units = result.data.keptUnits;
      skeleton = result.data.skeleton;
      return success({ tokens: result.data.tokens });
    },
  });
  if (!scouted.success) return scouted.outcome;
  await reportProgress(scouted.progress.stepStates);

  // Les étapes suivantes conservent l'ordre des actions : la tranche d'origine
  // relevée à l'extraction reste valable pour elles.
  let source: SourceChunks = { chunks, chunkIndexByAction: [] };
  const extracted = await runStep({
    progress: scouted.progress,
    name: 'extraction',
    run: async () => {
      const extraction = {
        instructions: input.instructions,
        disabledFields: input.disabledFields,
        currentDate: input.currentDate,
        signal: input.signal,
      };
      if (units) {
        const result = await structureUnits(llm, {
          units,
          skeleton,
          ...extraction,
        });
        if (result.success) {
          chunks = result.data.chunks;
          source = {
            chunks,
            chunkIndexByAction: result.data.chunkIndexByAction,
          };
        }
        return result;
      }
      const result = await extractActions(llm, { chunks, ...extraction });
      if (result.success) {
        source = { chunks, chunkIndexByAction: result.data.chunkIndexByAction };
      }
      return result;
    },
  });
  if (!extracted.success) return extracted.outcome;
  // Rattacher chaque action au squelette et fondre les doublons : des
  // extraits lus séparément ne se coordonnent pas seuls.
  const hierarchized = await runStep({
    progress: extracted.progress,
    name: 'hierarchy',
    skipWhen: units === null || skeleton === null,
    run: async (actions) => {
      const result = await consolidateHierarchy(llm, {
        actions,
        skeleton: skeleton as PlanSkeleton,
        signal: input.signal,
      });
      if (!result.success) {
        return result;
      }
      source = {
        chunks: source.chunks,
        chunkIndexByAction: result.data.keptIndexes.map(
          (index) => source.chunkIndexByAction[index]
        ),
      };
      return success({
        actions: result.data.actions,
        tokens: result.data.tokens,
        warnings: result.data.warnings,
      });
    },
  });
  if (!hierarchized.success) return hierarchized.outcome;
  await reportProgress(hierarchized.progress.stepStates);
  if (units) {
    source = coalesceChunks(source, VERIFICATION_WINDOW_TOKENS);
  }

  const scored = await runStep({
    progress: hierarchized.progress,
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
  warnings: [...progress.warnings, ...(produce.warnings ?? [])],
});

const markSkipped = (progress: Progress, name: StepName): Progress => ({
  ...progress,
  stepStates: { ...progress.stepStates, [name]: 'skipped' },
});

const markOk = (progress: Progress, name: StepName): Progress => ({
  ...progress,
  stepStates: { ...progress.stepStates, [name]: 'ok' },
});

type ReadSource = { chunks: string[]; units: DocumentUnit[] | null };

/**
 * Le document tel que l'extraction le lira : des unités de la taille d'une
 * fiche pour un modèle qui résume au-delà, le texte en tranches sinon.
 */
const readSource = (
  llm: PipelineLlm,
  document: ReadDocument
): Result<ReadSource, ReadingError> => {
  if (llm.capabilities.strategy === 'segmented') {
    const units = segmentDocument(document);
    if (units.length > MAX_DOCUMENT_UNITS) {
      return failure({
        kind: 'document_too_long',
        chunks: units.length,
        maxChunks: MAX_DOCUMENT_UNITS,
      });
    }
    return success({ chunks: [], units });
  }
  const text = joinPages(document);
  const chunks = splitDocument(text, {
    maxTokens: llm.maxInputTokens,
    overlapTokens: CHUNK_OVERLAP_TOKENS,
    header: isTabularKind(document.kind) ? text.split('\n', 1)[0] : undefined,
  });
  if (chunks.length > MAX_DOCUMENT_CHUNKS) {
    return failure({
      kind: 'document_too_long',
      chunks: chunks.length,
      maxChunks: MAX_DOCUMENT_CHUNKS,
    });
  }
  return success({ chunks, units: null });
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
  partialDraft: {
    actions: progress.actions,
    qualitativeReview: progress.review,
  },
  warnings: progress.warnings,
  stepStates: progress.stepStates,
  tokens: progress.tokens,
});

const done = (progress: Progress): PipelineOutcome => ({
  status: 'done',
  draft: { actions: progress.actions, qualitativeReview: progress.review },
  warnings: progress.warnings,
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
  warnings: [],
});
