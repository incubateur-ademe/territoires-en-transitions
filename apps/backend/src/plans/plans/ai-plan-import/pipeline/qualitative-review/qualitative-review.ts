import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { Result, success } from '@tet/backend/utils/result.type';
import { ExtractedAction } from '../../models/extracted-action';
import { buildQualitativeReviewPrompt } from './qualitative-review.prompt';
import { qualitativeReviewResponseSchema } from './qualitative-review.schema';
import { renderActionsCompact } from './render-actions-compact';

export type QualitativeReviewInput = {
  actions: ExtractedAction[];
  signal?: AbortSignal;
};

export type QualitativeReviewResult = {
  review: string;
  tokens: TokenUsage;
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
    signal,
  });
  if (!completion.success) {
    return completion;
  }

  return success({
    review: completion.data.data.avis,
    tokens: completion.data.tokens,
  });
};
