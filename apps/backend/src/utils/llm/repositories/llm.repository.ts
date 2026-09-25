import { Result } from '@tet/backend/utils/result.type';
import { LlmError } from '../llm.errors';
import { LlmCapabilities, LlmImage, LlmTier } from '../llm-tier';
import { TokenUsage } from '../token-usage';

export type LlmCompletionRequest = {
  prompt: string;
  tier: LlmTier;
  /** Absent : réponse en texte libre (transcription d'une page, par exemple). */
  jsonSchema?: Record<string, unknown>;
  images?: LlmImage[];
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
  /** Appels simultanés tolérés par les quotas du fournisseur. */
  abstract readonly maxConcurrentCalls: number;
  /** Tokens d'entrée par minute accordés à la clé ; null sans quota connu. */
  abstract readonly maxInputTokensPerMinute: number | null;
  abstract readonly capabilities: LlmCapabilities;

  /** Tokens d'entrée au-delà desquels le modèle du palier n'a plus la place de répondre. */
  abstract maxInputTokensFor(tier: LlmTier): number;
  abstract modelFor(tier: LlmTier): string | undefined;

  get maxInputTokens(): number {
    return this.maxInputTokensFor('strong');
  }

  abstract complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>>;
}
