import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { Result, success } from '@tet/backend/utils/result.type';
import { ExtractedAction } from '../../models/extracted-action';
import { keepSucceededBatches } from '../keep-succeeded-batches';
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
  warnings: string[];
  details: Record<string, number>;
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

  // Une action d'un groupe en échec reste sans score : la consolidation,
  // qui ne reprend que les scores faibles, la laisse telle quelle.
  const kept = keepSucceededBatches(
    groups,
    outcomes,
    (group) => `Actions non contrôlées pour ${group.items.length} action(s)`
  );
  if (!kept.success) {
    return kept;
  }
  const succeeded = kept.data.outcomes;
  return success({
    actions: applyScores(
      actions,
      succeeded.flatMap((outcome) => outcome.scores)
    ),
    tokens: sumTokenUsage(succeeded.map((outcome) => outcome.tokens)),
    warnings: kept.data.warnings,
    details: {
      batches: groups.length,
      failedBatches: kept.data.failedBatches,
    },
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
