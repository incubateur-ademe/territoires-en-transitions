import { DisableableField } from '../../models/disableable-field';
import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import {
  emptyTokenUsage,
  sumTokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { combineResults, Result, success } from '@tet/backend/utils/result.type';
import { chunk } from 'es-toolkit';
import { ExtractedAction } from '../../models/extracted-action';
import { applyEnrichments } from './apply-enrichments';
import { buildEnrichmentPrompt } from './enrich-sous-actions.prompt';
import {
  EnrichmentEntry,
  enrichmentResponseSchema,
} from './enrich-sous-actions.schema';
import {
  IndexedSousAction,
  indexSousActions,
  renderSousActionsToEnrich,
} from './index-sous-actions';

export const ENRICHMENT_BATCH_SIZE = 30;
export const ENRICHMENT_CONCURRENCY = 5;

export type EnrichSousActionsInput = {
  actions: ExtractedAction[];
  text: string;
  disabledFields: DisableableField[];
  signal?: AbortSignal;
};

export type EnrichSousActionsResult = {
  actions: ExtractedAction[];
  tokens: TokenUsage;
};

type BatchOutcome = { entries: EnrichmentEntry[]; tokens: TokenUsage };

export const enrichSousActions = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { actions, text, disabledFields, signal }: EnrichSousActionsInput
): Promise<Result<EnrichSousActionsResult, LlmError>> => {
  const indexed = indexSousActions(actions);
  if (indexed.length === 0) {
    return success({ actions, tokens: emptyTokenUsage() });
  }

  const batches = chunk(indexed, ENRICHMENT_BATCH_SIZE);
  const outcomes = await mapWithConcurrency(
    batches,
    ENRICHMENT_CONCURRENCY,
    (batch) => enrichBatch(llm, { batch, text, disabledFields, signal })
  );

  const combined = combineResults(outcomes);
  if (!combined.success) {
    return combined;
  }

  const succeeded = combined.data;
  return success({
    actions: applyEnrichments(
      actions,
      indexed,
      succeeded.flatMap((outcome) => outcome.entries)
    ),
    tokens: sumTokenUsage(succeeded.map((outcome) => outcome.tokens)),
  });
};

const enrichBatch = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    batch,
    text,
    disabledFields,
    signal,
  }: {
    batch: IndexedSousAction[];
    text: string;
    disabledFields: DisableableField[];
    signal?: AbortSignal;
  }
): Promise<Result<BatchOutcome, LlmError>> => {
  const completion = await llm.generateStructured({
    prompt: buildEnrichmentPrompt({
      renderedSousActions: renderSousActionsToEnrich(batch),
      text,
      disabledFields,
    }),
    schema: enrichmentResponseSchema,
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
