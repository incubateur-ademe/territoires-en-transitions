import { Result } from '@tet/backend/utils/result.type';
import { LlmError } from '../llm.errors';
import { TokenUsage } from '../token-usage';

export type LlmCompletionRequest = {
  prompt: string;
  jsonSchema: Record<string, unknown>;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  signal?: AbortSignal;
};

export type LlmRawCompletion = {
  completed: boolean;
  text: string | undefined;
  usage: TokenUsage;
};

export abstract class LlmRepository {
  /** Tokens d'entrée au-delà desquels le modèle n'a plus la place de répondre. */
  abstract readonly maxInputTokens: number;
  /** Appels simultanés tolérés par les quotas du fournisseur. */
  abstract readonly maxConcurrentCalls: number;

  abstract complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>>;
}
