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
  const extracted = await runStep(initialProgress(), 'extraction', () =>
    extractActions(llm, {
      text: input.text,
      instructions: input.instructions,
      disabledFields: input.disabledFields,
      currentDate: input.currentDate,
      signal: input.signal,
    })
  );
  if (!extracted.success) return extracted.outcome;

  const scored = await runOptionalStep(
    extracted.progress,
    'scoring',
    input.withVerifications,
    (actions) =>
      scoreActions(llm, { actions, text: input.text, signal: input.signal })
  );
  if (!scored.success) return scored.outcome;

  const consolidated = await runOptionalStep(
    scored.progress,
    'consolidation',
    input.withVerifications,
    (actions) =>
      consolidateActions(llm, {
        actions,
        text: input.text,
        disabledFields: input.disabledFields,
        signal: input.signal,
      })
  );
  if (!consolidated.success) return consolidated.outcome;

  const enriched = await runOptionalStep(
    consolidated.progress,
    'enrichment',
    input.withSousActions,
    (actions) =>
      enrichSousActions(llm, {
        actions,
        text: input.text,
        disabledFields: input.disabledFields,
        signal: input.signal,
      }),
    withoutSousActions
  );
  if (!enriched.success) return enriched.outcome;

  const reviewed = await runStep(
    enriched.progress,
    'qualitativeReview',
    () =>
      reviewQuality(llm, {
        actions: enriched.progress.actions,
        signal: input.signal,
      })
  );
  if (!reviewed.success) return reviewed.outcome;

  return done(reviewed.progress);
};

const runOptionalStep = async (
  progress: Progress,
  name: StepName,
  enabled: boolean,
  run: (
    actions: ExtractedAction[]
  ) => Promise<Result<StepProduce, PipelineError>>,
  onSkip: (progress: Progress) => Progress = (skipped) => skipped
): Promise<StepGo> => {
  if (!enabled) {
    return { success: true, progress: markSkipped(onSkip(progress), name) };
  }
  return runStep(progress, name, () => run(progress.actions));
};

const runStep = async (
  progress: Progress,
  name: StepName,
  run: () => Promise<Result<StepProduce, PipelineError>>
): Promise<StepGo> => {
  const result = await run();
  if (!result.success) {
    return { success: false, outcome: failed(progress, name, result.error) };
  }
  return { success: true, progress: advance(progress, name, result.data) };
};

const advance = (
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

const withoutSousActions = (progress: Progress): Progress => ({
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

const initialProgress = (): Progress => ({
  actions: [],
  review: null,
  tokens: emptyTokenUsage(),
  stepStates: {
    extraction: 'pending',
    scoring: 'pending',
    consolidation: 'pending',
    enrichment: 'pending',
    qualitativeReview: 'pending',
  },
});
