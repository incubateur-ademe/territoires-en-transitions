import { DisableableField } from '../models/disableable-field';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import {
  isTabularKind,
  joinPages,
  ReadDocument,
} from './document/document-page';
import { structureUnits } from './extract-actions/structure-units';
import { consolidateHierarchy } from './consolidate-hierarchy/consolidate-hierarchy';
import { dropRedundantSousAxes } from './consolidate-hierarchy/drop-redundant-sous-axes';
import { PlanSkeleton } from '../models/plan-skeleton';
import {
  detectDocumentTome,
  WrongTome,
} from './detect-document-tome/detect-document-tome';
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
import { recordLlmCalls } from '@tet/backend/utils/llm/llm-call-recorder';
import { describeLlmError } from '@tet/backend/utils/llm/llm.errors';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { ExtractedAction } from '../models/extracted-action';
import type { ImportStepRun } from '../models/import-step-run';
import { PlanDraft } from '../models/plan-draft';
import { classifySecteurs } from './classify-secteurs/classify-secteurs';
import { consolidateActions } from './consolidate-actions/consolidate-actions';
import { enrichSousActions } from './enrich-sous-actions/enrich-sous-actions';
import {
  ExtractActionsError,
  extractActions,
} from './extract-actions/extract-actions';
import { reviewQuality } from './qualitative-review/qualitative-review';
import { scoreActions } from './score-actions/score-actions';
import {
  PIPELINE_CHECKPOINT_SCHEMA_VERSION,
  type PipelineCheckpoint,
  type PipelineProgress,
  type PipelineState,
} from './pipeline-checkpoint';

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
  secteurs: stepStateSchema.default('skipped'),
  qualitativeReview: stepStateSchema,
});

export type StepState = z.infer<typeof stepStateSchema>;

export type StepStates = z.infer<typeof stepStatesSchema>;

export type StepName = keyof StepStates;

export type ReadingError =
  | {
      kind: 'document_too_long';
      chunks: number;
      maxChunks: number;
    }
  | {
      /** Le document déposé est un autre tome du PCAET, sans fiche action. */
      kind: 'wrong_document_tome';
      tome: WrongTome;
      evidence: string;
    };

export type PipelineError = ExtractActionsError | ReadingError;

/** L'erreur en une ligne : le statut HTTP ou la règle violée quand il y en a. */
export const describePipelineError = (error: PipelineError): string =>
  error.kind === 'api_error' || error.kind === 'invalid_json'
    ? describeLlmError(error)
    : error.kind;

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
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
  withVerifications: boolean;
  withSousActions: boolean;
  /** Secteurs réglementaires proposés pour chaque action : plans PCAET. */
  withSecteurs?: boolean;
  signal?: AbortSignal;
  onStepStatesChange?: (stepStates: Readonly<StepStates>) => Promise<void>;
  /** Chaque étape terminée, passée ou en échec : durée, appels, comptes. */
  onStepRun?: (run: ImportStepRun) => Promise<void>;
  /** Après chaque étape terminée : de quoi reprendre l'import à cet endroit. */
  onCheckpoint?: (checkpoint: PipelineCheckpoint) => Promise<void>;
} & (
  | { document: ReadDocument; resumeFrom?: undefined }
  // Reprise : la lecture est faite, le document n'est pas relu.
  | { document?: undefined; resumeFrom: PipelineCheckpoint }
);

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

type Progress = PipelineProgress;

type StepProduce = {
  actions?: ExtractedAction[];
  review?: string | null;
  tokens: TokenUsage;
  warnings?: string[];
  /** Comptes propres à l'étape, pour la télémétrie. */
  details?: Record<string, number>;
};

type StepGo =
  | { success: true; progress: Progress }
  | { success: false; outcome: PipelineOutcome };

/** Les étapes après la lecture, dans l'ordre où elles s'exécutent. */
type PipelineStep = {
  name: StepName;
  /** Évalué au moment de l'étape : il dépend de ce qu'ont produit les précédentes. */
  skipWhen?: () => boolean;
  onSkip?: (progress: Progress) => Progress;
  run: (
    actions: ExtractedAction[]
  ) => Promise<Result<StepProduce, PipelineError>>;
  /** Appliqué au résultat, passé ou non, avant le point de reprise. */
  finalize?: (progress: Progress) => Progress;
};

const STEP_ORDER = stepStatesSchema.keyof().options;

/** Après la dernière étape, plus rien ne lit le découpage : tout modèle convient. */
export const isCheckpointUsableBy = (
  checkpoint: Pick<
    PipelineCheckpoint,
    'schemaVersion' | 'llm' | 'completedStep'
  >,
  llm: PipelineLlm
): boolean =>
  checkpoint.schemaVersion === PIPELINE_CHECKPOINT_SCHEMA_VERSION &&
  (checkpoint.completedStep === STEP_ORDER[STEP_ORDER.length - 1] ||
    (checkpoint.llm?.strategy === llm.capabilities.strategy &&
      checkpoint.llm?.maxInputTokens === llm.maxInputTokens));

export const runImportPipeline = async (
  llm: PipelineLlm,
  input: RunImportPipelineInput
): Promise<PipelineOutcome> => {
  const reportProgress = (stepStates: StepStates): Promise<void> =>
    input.onStepStatesChange?.(stepStates) ?? Promise.resolve();

  const reportStepRun = (run: ImportStepRun): Promise<void> =>
    input.onStepRun?.(run) ?? Promise.resolve();

  let state: PipelineState;
  if (input.resumeFrom) {
    const { progress, chunks, units, skeleton, source } = input.resumeFrom;
    state = { progress, chunks, units, skeleton, source };
  } else {
    const readingStartedAt = new Date();
    const read = readSource(llm, input.document);
    await reportStepRun({
      step: 'reading',
      status: read.success ? 'ok' : 'failed',
      startedAt: readingStartedAt,
      endedAt: new Date(),
      calls: [],
      details: read.success
        ? read.data.units
          ? { units: read.data.units.length }
          : { chunks: read.data.chunks.length }
        : {},
      error: read.success ? null : read.error.kind,
    });
    if (!read.success) {
      return failed(initialProgress(), 'reading', read.error);
    }
    state = {
      progress: markOk(initialProgress(), 'reading'),
      chunks: read.data.chunks,
      units: read.data.units,
      skeleton: null,
      source: { chunks: read.data.chunks, chunkIndexByAction: [] },
    };
  }

  const checkpoint = (completedStep: StepName): Promise<void> =>
    input.onCheckpoint?.({
      schemaVersion: PIPELINE_CHECKPOINT_SCHEMA_VERSION,
      completedStep,
      currentDate: input.currentDate,
      llm: {
        strategy: llm.capabilities.strategy,
        maxInputTokens: llm.maxInputTokens,
      },
      ...state,
    }) ?? Promise.resolve();

  if (!input.resumeFrom) {
    await checkpoint('reading');
  }
  await reportProgress(state.progress.stepStates);

  const steps: PipelineStep[] = [
    // Écarter ce qui ne contient pas d'action et relever le squelette du plan :
    // seulement quand le document est lu par unités.
    {
      name: 'scouting',
      skipWhen: () => state.units === null,
      run: async () => {
        const result = await scoutUnits(llm, {
          units: state.units as DocumentUnit[],
          signal: input.signal,
        });
        if (!result.success) {
          return result;
        }
        state.units = result.data.keptUnits;
        state.skeleton = result.data.skeleton;
        return success({
          tokens: result.data.tokens,
          warnings: result.data.warnings,
          details: {
            keptUnits: result.data.keptUnits.length,
            discardedUnits: result.data.discardedCount,
          },
        });
      },
    },
    // Les étapes suivantes conservent l'ordre des actions : la tranche
    // d'origine relevée à l'extraction reste valable pour elles.
    {
      name: 'extraction',
      run: async () => {
        const extraction = {
          instructions: input.instructions,
          disabledFields: input.disabledFields,
          currentDate: input.currentDate,
          signal: input.signal,
        };
        if (state.units) {
          const result = await structureUnits(llm, {
            units: state.units,
            skeleton: state.skeleton,
            ...extraction,
          });
          if (result.success) {
            state.chunks = result.data.chunks;
            state.source = {
              chunks: state.chunks,
              chunkIndexByAction: result.data.chunkIndexByAction,
            };
          }
          return result;
        }
        const result = await extractActions(llm, {
          chunks: state.chunks,
          ...extraction,
        });
        if (result.success) {
          state.source = {
            chunks: state.chunks,
            chunkIndexByAction: result.data.chunkIndexByAction,
          };
        }
        return result;
      },
    },
    // Rattacher chaque action au squelette et fondre les doublons : des
    // extraits lus séparément ne se coordonnent pas seuls.
    {
      name: 'hierarchy',
      skipWhen: () => state.units === null || state.skeleton === null,
      run: async (actions) => {
        const result = await consolidateHierarchy(llm, {
          actions,
          skeleton: state.skeleton as PlanSkeleton,
          signal: input.signal,
        });
        if (!result.success) {
          return result;
        }
        const { source } = state;
        state.source = {
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
      // Lus par morceaux, le sommaire et la fiche se répondent : une fiche peut
      // s'y retrouver sous-axe d'elle-même.
      finalize: (progress) => {
        if (!state.units) {
          return progress;
        }
        state.source = coalesceChunks(state.source, VERIFICATION_WINDOW_TOKENS);
        return {
          ...progress,
          actions: dropRedundantSousAxes(progress.actions),
        };
      },
    },
    {
      name: 'scoring',
      skipWhen: () => !input.withVerifications,
      run: (actions) =>
        scoreActions(llm, {
          actions,
          source: state.source,
          signal: input.signal,
        }),
    },
    {
      name: 'consolidation',
      skipWhen: () => !input.withVerifications,
      run: (actions) =>
        consolidateActions(llm, {
          actions,
          source: state.source,
          disabledFields: input.disabledFields,
          signal: input.signal,
        }),
    },
    {
      name: 'enrichment',
      skipWhen: () => !input.withSousActions,
      onSkip: clearSousActions,
      run: (actions) =>
        enrichSousActions(llm, {
          actions,
          source: state.source,
          disabledFields: input.disabledFields,
          signal: input.signal,
        }),
    },
    {
      name: 'secteurs',
      skipWhen: () => !input.withSecteurs,
      run: (actions) =>
        classifySecteurs(llm, {
          actions,
          source: state.source,
          signal: input.signal,
        }),
    },
    {
      name: 'qualitativeReview',
      run: (actions) => reviewQuality(llm, { actions, signal: input.signal }),
    },
  ];

  const lastCompleted = STEP_ORDER.indexOf(
    input.resumeFrom?.completedStep ?? 'reading'
  );
  for (const { name, skipWhen, onSkip, run, finalize } of steps) {
    if (STEP_ORDER.indexOf(name) <= lastCompleted) {
      continue;
    }
    const go = await runStep({
      reportStepRun,
      progress: state.progress,
      name,
      run,
      skipWhen: skipWhen?.() ?? false,
      onSkip,
    });
    if (!go.success) return go.outcome;
    state.progress = finalize ? finalize(go.progress) : go.progress;
    await checkpoint(name);
    await reportProgress(state.progress.stepStates);
  }

  return done(state.progress);
};

type RunStepArgs = {
  reportStepRun: (run: ImportStepRun) => Promise<void>;
  progress: Progress;
  name: StepName;
  run: (
    actions: ExtractedAction[]
  ) => Promise<Result<StepProduce, PipelineError>>;
  skipWhen?: boolean;
  onSkip?: (progress: Progress) => Progress;
};

const runStep = async ({
  reportStepRun,
  progress,
  name,
  run,
  skipWhen = false,
  onSkip,
}: RunStepArgs): Promise<StepGo> => {
  const startedAt = new Date();
  if (skipWhen) {
    const skipped = onSkip ? onSkip(progress) : progress;
    await reportStepRun({
      step: name,
      status: 'skipped',
      startedAt,
      endedAt: startedAt,
      calls: [],
      details: {},
      error: null,
    });
    return { success: true, progress: markSkipped(skipped, name) };
  }

  const recorded = await recordLlmCalls(() => run(progress.actions)).catch(
    async (error: unknown) => {
      await reportStepRun({
        step: name,
        status: 'failed',
        startedAt,
        endedAt: new Date(),
        calls: [],
        details: { actionsIn: progress.actions.length },
        error: 'interrupted',
      });
      throw error;
    }
  );
  const { result, calls } = recorded;
  await reportStepRun({
    step: name,
    status: result.success ? 'ok' : 'failed',
    startedAt,
    endedAt: new Date(),
    calls,
    details: {
      actionsIn: progress.actions.length,
      ...(result.success && {
        actionsOut: (result.data.actions ?? progress.actions).length,
        warnings: result.data.warnings?.length ?? 0,
        ...result.data.details,
      }),
    },
    error: result.success ? null : describePipelineError(result.error),
  });
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
  const tome = detectDocumentTome(document);
  if (tome.verdict === 'wrong_tome') {
    return failure({
      kind: 'wrong_document_tome',
      tome: tome.tome,
      evidence: tome.evidence,
    });
  }
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
  secteurs: 'pending',
  qualitativeReview: 'pending',
});

const initialProgress = (): Progress => ({
  actions: [],
  review: null,
  tokens: emptyTokenUsage(),
  stepStates: initialStepStates(),
  warnings: [],
});
