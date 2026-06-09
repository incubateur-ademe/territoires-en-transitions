import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { Result, success } from '@tet/backend/utils/result.type';
import { ExtractedAction } from '../../models/extracted-action';
import { applyScores } from './apply-scores';
import { buildScoringPrompt } from './score-actions.prompt';
import { scoringResponseSchema } from './score-actions.schema';
import { renderActionsText } from './render-actions-text';

export type ScoreActionsInput = {
  actions: ExtractedAction[];
  text: string;
  signal?: AbortSignal;
};

export type ScoreActionsResult = {
  actions: ExtractedAction[];
  tokens: TokenUsage;
};

export const scoreActions = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { actions, text, signal }: ScoreActionsInput
): Promise<Result<ScoreActionsResult, LlmError>> => {
  const completion = await llm.generateStructured({
    prompt: buildScoringPrompt({
      renderedActions: renderActionsText(actions),
      text,
    }),
    schema: scoringResponseSchema,
    signal,
  });
  if (!completion.success) {
    return completion;
  }

  const { data: scores, tokens } = completion.data;
  return success({ actions: applyScores(actions, scores), tokens });
};
