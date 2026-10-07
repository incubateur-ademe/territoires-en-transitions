import { estimateTokenCount } from './estimate-token-count';
import { LlmCompletionRequest } from './repositories/llm.repository';

/** Une page A4 en JPEG de 1 400 px : de l'ordre de mille à deux mille tokens. */
const IMAGE_TOKEN_ESTIMATE = 1_500;

/** Tokens d'entrée d'un appel, estimés avant de l'envoyer. */
export const estimateRequestTokens = (
  request: Pick<
    LlmCompletionRequest,
    'prompt' | 'systemInstruction' | 'jsonSchema' | 'images'
  >
): number =>
  estimateTokenCount(
    request.prompt +
      (request.systemInstruction ?? '') +
      (request.jsonSchema ? JSON.stringify(request.jsonSchema) : '')
  ) +
  (request.images?.length ?? 0) * IMAGE_TOKEN_ESTIMATE;
