import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { isFailure, isSuccess, Result, success } from '@tet/backend/utils/result.type';
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
  disabledFields: string[];
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
  const lowScore = selectLowScoreActions(actions);
  if (lowScore.length === 0) {
    return success({ actions, tokens: emptyTokenUsage() });
  }

  const batches = chunk(lowScore, CONSOLIDATION_BATCH_SIZE);
  const outcomes = await runWithBoundedConcurrency(
    batches,
    CONSOLIDATION_CONCURRENCY,
    (batch) => consolidateBatch(llm, { batch, text, disabledFields, signal })
  );

  const failed = outcomes.find(isFailure);
  if (failed) {
    return failed;
  }

  const succeeded = outcomes.filter(isSuccess).map((outcome) => outcome.data);
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
    disabledFields: string[];
    signal?: AbortSignal;
  }
): Promise<Result<BatchOutcome, LlmError>> => {
  const completion = await llm.generateStructured({
    prompt: buildConsolidationPrompt({
      actionsToImprove: renderActionsToImprove(batch),
      text,
      disabledFields,
    }),
    schema: consolidationResponseSchema,
    signal,
  });
  if (!completion.success) {
    return completion;
  }
  return success({
    entries: completion.data.data,
    tokens: completion.data.tokens,
  });
};

const renderActionsToImprove = (batch: IndexedAction[]): string =>
  batch.map(({ index, action }) => `|${index}| ${action.titre}`).join('\n');

const runWithBoundedConcurrency = async <Item, Output>(
  items: Item[],
  concurrency: number,
  run: (item: Item) => Promise<Output>
): Promise<Output[]> => {
  const outputs: Output[] = [];
  for (const group of chunk(items, concurrency)) {
    outputs.push(...(await Promise.all(group.map(run))));
  }
  return outputs;
};

const emptyTokenUsage = (): TokenUsage => ({
  promptTokens: 0,
  candidatesTokens: 0,
  thoughtsTokens: 0,
  totalTokens: 0,
});

const sumTokenUsage = (usages: TokenUsage[]): TokenUsage =>
  usages.reduce(
    (total, usage) => ({
      promptTokens: total.promptTokens + usage.promptTokens,
      candidatesTokens: total.candidatesTokens + usage.candidatesTokens,
      thoughtsTokens: total.thoughtsTokens + usage.thoughtsTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
    }),
    emptyTokenUsage()
  );
