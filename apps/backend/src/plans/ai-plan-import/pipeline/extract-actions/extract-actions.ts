import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { buildChunkContext } from './build-chunk-context';
import {
  buildExtractionPrompt,
  ExtractionPromptInput,
} from './extract-actions.prompt';
import { extractionResponseSchema } from './extract-actions.schema';
import { extractionResponseToExtractedActions } from './extraction-response-to-extracted-actions';
import { ChunkedActions, mergeChunkActions } from './merge-chunk-actions';

export type ExtractActionsInput = Omit<ExtractionPromptInput, 'text'> & {
  chunks: string[];
  signal?: AbortSignal;
};

export type ExtractActionsResult = ChunkedActions & {
  tokens: TokenUsage;
};

export type ExtractActionsError = LlmError | { kind: 'no_actions_extracted' };

/**
 * Une tranche sans action (le diagnostic d'un PCAET, par exemple) n'est pas
 * une erreur : seul un document entier sans action en est une.
 */
export const extractActions = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { chunks, signal, ...promptInput }: ExtractActionsInput
): Promise<Result<ExtractActionsResult, ExtractActionsError>> => {
  let extracted: ChunkedActions = { actions: [], chunkIndexByAction: [] };
  const usages: TokenUsage[] = [];

  // En série : chaque tranche reprend l'axe où s'est arrêtée la précédente.
  for (const [chunkIndex, chunk] of chunks.entries()) {
    const context =
      chunkIndex === 0
        ? ''
        : buildChunkContext({
            chunkIndex,
            chunkCount: chunks.length,
            previousActions: extracted.actions,
          });
    const completion = await llm.generateStructured({
      prompt: buildExtractionPrompt({ ...promptInput, text: context + chunk }),
      schema: extractionResponseSchema,
      signal,
    });
    if (!completion.success) {
      return completion;
    }
    usages.push(completion.data.tokens);
    extracted = mergeChunkActions(
      extracted,
      extractionResponseToExtractedActions(completion.data.data),
      chunkIndex
    );
  }

  if (extracted.actions.length === 0) {
    return failure({ kind: 'no_actions_extracted' });
  }
  return success({ ...extracted, tokens: sumTokenUsage(usages) });
};
