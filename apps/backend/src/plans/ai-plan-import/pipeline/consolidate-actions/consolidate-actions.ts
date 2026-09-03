import { DisableableField } from '../../models/disableable-field';
import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import {
  emptyTokenUsage,
  sumTokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { combineResults, Result, success } from '@tet/backend/utils/result.type';
import { chunk } from 'es-toolkit';
import { ExtractedAction } from '../../models/extracted-action';
import { buildConsolidationPrompt } from './consolidate-actions.prompt';
import {
  ConsolidationEntry,
  consolidationResponseSchema,
} from './consolidate-actions.schema';
import {
  IndexedAction,
  selectLowScoreActions,
} from './select-low-score-actions';
import { updateActionsWithConsolidatedEntries } from './update-actions-with-consolidated-entries';

export const CONSOLIDATION_BATCH_SIZE = 5;
export const CONSOLIDATION_CONCURRENCY = 5;

export type ConsolidateActionsInput = {
  actions: ExtractedAction[];
  text: string;
  disabledFields: DisableableField[];
  signal?: AbortSignal;
};

export type ConsolidateActionsResult = {
  actions: ExtractedAction[];
  tokens: TokenUsage;
};

type BatchOutcome = { entries: ConsolidationEntry[]; tokens: TokenUsage };

export const consolidateActions = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { actions, text, disabledFields, signal }: ConsolidateActionsInput
): Promise<Result<ConsolidateActionsResult, LlmError>> => {
  const lowScoreActions = selectLowScoreActions(actions);
  if (lowScoreActions.length === 0) {
    return success({ actions, tokens: emptyTokenUsage() });
  }

  const batches = chunk(lowScoreActions, CONSOLIDATION_BATCH_SIZE);
  const outcomes = await mapWithConcurrency(
    batches,
    CONSOLIDATION_CONCURRENCY,
    (batch) => consolidateBatch(llm, { batch, text, disabledFields, signal })
  );

  const combined = combineResults(outcomes);
  if (!combined.success) {
    return combined;
  }

  const succeeded = combined.data;
  return success({
    actions: updateActionsWithConsolidatedEntries(
      actions,
      succeeded.flatMap((outcome) => outcome.entries)
    ),
    tokens: sumTokenUsage(succeeded.map((outcome) => outcome.tokens)),
  });
};

const consolidateBatch = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    batch,
    text,
    disabledFields,
    signal,
  }: {
    batch: IndexedAction[];
    text: string;
    disabledFields: DisableableField[];
    signal?: AbortSignal;
  }
): Promise<Result<BatchOutcome, LlmError>> => {
  const completion = await llm.generateStructured({
    prompt: buildConsolidationPrompt({
      renderedActionsToImprove: renderActionsToImprove(batch),
      text,
      disabledFields,
    }),
    schema: consolidationResponseSchema,
    signal,
  });
  if (!completion.success) {
    return completion;
  }
  const requestedIndices = new Set(batch.map(({ index }) => index));
  return success({
    entries: completion.data.data.filter((entry) =>
      requestedIndices.has(entry.index)
    ),
    tokens: completion.data.tokens,
  });
};

const renderActionsToImprove = (batch: IndexedAction[]): string =>
  batch.map(({ index, action }) => `|${index}| ${action.titre}`).join('\n');
