import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import {
  combineResults,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { ExtractedAction } from '../../models/extracted-action';
import {
  ChunkGroup,
  groupByChunk,
  SourceChunks,
} from '../source-chunks/source-chunks';
import { applyScores } from './apply-scores';
import { buildScoringPrompt } from './score-actions.prompt';
import { ScoringEntry, scoringResponseSchema } from './score-actions.schema';
import { renderActionsText } from './render-actions-text';

export const SCORING_CONCURRENCY = 5;

export type ScoreActionsInput = {
  actions: ExtractedAction[];
  source: SourceChunks;
  signal?: AbortSignal;
};

export type ScoreActionsResult = {
  actions: ExtractedAction[];
  tokens: TokenUsage;
};

type IndexedAction = { index: number; action: ExtractedAction };

type GroupOutcome = { scores: ScoringEntry[]; tokens: TokenUsage };

export const scoreActions = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { actions, source, signal }: ScoreActionsInput
): Promise<Result<ScoreActionsResult, LlmError>> => {
  const groups = groupByChunk(
    actions.map((action, index) => ({ index, action })),
    ({ index }) => index,
    source
  );
  const outcomes = await mapWithConcurrency(
    groups,
    SCORING_CONCURRENCY,
    (group) => scoreGroup(llm, { group, signal })
  );

  const combined = combineResults(outcomes);
  if (!combined.success) {
    return combined;
  }
  return success({
    actions: applyScores(
      actions,
      combined.data.flatMap((outcome) => outcome.scores)
    ),
    tokens: sumTokenUsage(combined.data.map((outcome) => outcome.tokens)),
  });
};

const scoreGroup = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { group, signal }: { group: ChunkGroup<IndexedAction>; signal?: AbortSignal }
): Promise<Result<GroupOutcome, LlmError>> => {
  const completion = await llm.generateStructured({
    prompt: buildScoringPrompt({
      renderedActions: renderActionsText(
        group.items.map(({ action }) => action)
      ),
      text: group.text,
    }),
    schema: scoringResponseSchema,
    signal,
  });
  if (!completion.success) {
    return completion;
  }

  // Le prompt numérote les actions de la tranche à partir de 0.
  const scores = completion.data.data.flatMap((score) => {
    const item = group.items[score.index];
    return item ? [{ ...score, index: item.index }] : [];
  });
  return success({ scores, tokens: completion.data.tokens });
};
