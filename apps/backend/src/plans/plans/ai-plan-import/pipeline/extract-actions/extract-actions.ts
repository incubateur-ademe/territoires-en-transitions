import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ExtractedAction } from '../../models/extracted-action';
import {
  buildExtractionPrompt,
  ExtractionPromptInput,
} from './extract-actions.prompt';
import { extractionResponseSchema } from './extract-actions.schema';
import { extractionResponseToExtractedActions } from './extraction-response-to-extracted-actions';

export type ExtractActionsInput = ExtractionPromptInput & {
  signal?: AbortSignal;
};

export type ExtractActionsResult = {
  actions: ExtractedAction[];
  tokens: TokenUsage;
};

export type ExtractActionsError = LlmError | { kind: 'no_actions_extracted' };

export const extractActions = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { signal, ...promptInput }: ExtractActionsInput
): Promise<Result<ExtractActionsResult, ExtractActionsError>> => {
  const completion = await llm.generateStructured({
    prompt: buildExtractionPrompt(promptInput),
    schema: extractionResponseSchema,
    signal,
  });
  if (!completion.success) {
    return completion;
  }

  const { data: response, tokens } = completion.data;
  if (response.length === 0) {
    return failure({ kind: 'no_actions_extracted' });
  }

  return success({
    actions: extractionResponseToExtractedActions(response),
    tokens,
  });
};
