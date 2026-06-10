import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import {
  emptyTokenUsage,
  sumTokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { Result } from '@tet/backend/utils/result.type';
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

export type StepName =
  | 'extraction'
  | 'scoring'
  | 'consolidation'
  | 'enrichment'
  | 'qualitativeReview';

export type StepState = 'ok' | 'skipped' | 'pending';

export type StepStates = Record<StepName, StepState>;

export type PipelineError = ExtractActionsError;

export type RunImportPipelineInput = {
  text: string;
  instructions: string;
  disabledFields: string[];
  currentDate: string;
  withVerifications: boolean;
  withSousActions: boolean;
  signal?: AbortSignal;
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
  llm: Pick<LlmService, 'generateStructured'>,
  input: RunImportPipelineInput
): Promise<PipelineOutcome> => {
  const extracted = await runStep({
    progress: initialProgress(),
    name: 'extraction',
    run: () =>
      extractActions(llm, {
        text: input.text,
        instructions: input.instructions,
        disabledFields: input.disabledFields,
        currentDate: input.currentDate,
        signal: input.signal,
      }),
  });
  if (!extracted.success) return extracted.outcome;

  const scored = await runStep({
    progress: extracted.progress,
    name: 'scoring',
    skipWhen: !input.withVerifications,
    run: (actions) =>
      scoreActions(llm, { actions, text: input.text, signal: input.signal }),
  });
  if (!scored.success) return scored.outcome;

  const consolidated = await runStep({
    progress: scored.progress,
    name: 'consolidation',
    skipWhen: !input.withVerifications,
    run: (actions) =>
      consolidateActions(llm, {
        actions,
        text: input.text,
        disabledFields: input.disabledFields,
        signal: input.signal,
      }),
  });
  if (!consolidated.success) return consolidated.outcome;

  const enriched = await runStep({
    progress: consolidated.progress,
    name: 'enrichment',
    skipWhen: !input.withSousActions,
    onSkip: clearSousActions,
    run: (actions) =>
      enrichSousActions(llm, {
        actions,
        text: input.text,
        disabledFields: input.disabledFields,
        signal: input.signal,
      }),
  });
  if (!enriched.success) return enriched.outcome;

  const reviewed = await runStep({
    progress: enriched.progress,
    name: 'qualitativeReview',
    run: (actions) => reviewQuality(llm, { actions, signal: input.signal }),
  });
  if (!reviewed.success) return reviewed.outcome;

  return done(reviewed.progress);
};

type RunStepArgs = {
  progress: Progress;
  name: StepName;
  run: (actions: ExtractedAction[]) => Promise<Result<StepProduce, PipelineError>>;
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
  return { success: true, progress: mergeStepResult(progress, name, result.data) };
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
  extraction: 'pending',
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
