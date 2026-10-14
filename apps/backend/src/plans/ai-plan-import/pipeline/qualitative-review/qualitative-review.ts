import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import {
  emptyTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { Result, success } from '@tet/backend/utils/result.type';
import { ExtractedAction } from '../../models/extracted-action';
import { keepSucceededBatches } from '../keep-succeeded-batches';
import { buildQualitativeReviewPrompt } from './qualitative-review.prompt';
import { qualitativeReviewResponseSchema } from './qualitative-review.schema';
import { renderActionsCompact } from './render-actions-compact';

export type QualitativeReviewInput = {
  actions: ExtractedAction[];
  signal?: AbortSignal;
};

export type QualitativeReviewResult = {
  review: string | null;
  tokens: TokenUsage;
  warnings: string[];
  details: Record<string, number>;
};

export const reviewQuality = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { actions, signal }: QualitativeReviewInput
): Promise<Result<QualitativeReviewResult, LlmError>> => {
  const completion = await llm.generateStructured({
    prompt: buildQualitativeReviewPrompt({
      renderedActions: renderActionsCompact(actions),
    }),
    schema: qualitativeReviewResponseSchema,
    reasoningEffort: 'low',
    signal,
  });
  // Un seul lot : la règle des étapes par lots s'applique telle quelle.
  const kept = keepSucceededBatches(
    [actions],
    [completion],
    () => 'Relecture finale non faite'
  );
  if (!kept.success) {
    return kept;
  }

  const [reviewed] = kept.data.outcomes;
  return success({
    review: reviewed?.data.avis ?? null,
    tokens: reviewed?.tokens ?? emptyTokenUsage(),
    warnings: kept.data.warnings,
    details: { failedBatches: kept.data.failedBatches },
  });
};
