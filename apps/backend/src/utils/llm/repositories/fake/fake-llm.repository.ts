import { failure, Result, success } from '@tet/backend/utils/result.type';
import { LlmChatRequest, LlmChatTurn, LlmToolCall } from '../../llm-chat';
import { LlmError } from '../../llm.errors';
import { LlmCapabilities, LlmTier } from '../../llm-tier';
import { emptyTokenUsage } from '../../token-usage';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
} from '../llm.repository';

type ScriptedTurn =
  | { text?: string; toolCalls?: LlmToolCall[] }
  | { error: LlmError };

/**
 * Modèle scripté pour les tests : chaque appel à `chat` consomme le prochain
 * tour préparé par `enqueue`, et les requêtes reçues restent lisibles. Aucun
 * réseau. Idée reprise de l'assistant de Planck.
 */
export class FakeLlmRepository extends LlmRepository {
  readonly maxConcurrentCalls = 10;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  readonly capabilities: LlmCapabilities = {
    ocr: false,
    strategy: 'whole-document',
  };
  readonly requests: LlmChatRequest[] = [];
  private readonly script: ScriptedTurn[] = [];

  enqueue(...turns: ScriptedTurn[]): this {
    this.script.push(...turns);
    return this;
  }

  reset(): void {
    this.script.length = 0;
    this.requests.length = 0;
  }

  maxInputTokensFor(_tier: LlmTier): number {
    return 100_000;
  }

  modelFor(_tier: LlmTier): string {
    return 'fake-model';
  }

  async complete(
    _request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    return failure({ kind: 'api_error', httpStatus: null });
  }

  async chat(request: LlmChatRequest): Promise<Result<LlmChatTurn, LlmError>> {
    // Copie : l'appelant continue d'ajouter des messages au même tableau.
    this.requests.push({ ...request, messages: [...request.messages] });
    const next = this.script.shift();
    if (!next) {
      return failure({ kind: 'api_error', httpStatus: 400 });
    }
    if ('error' in next) {
      return failure(next.error);
    }
    return success({
      completed: true,
      text: next.text,
      toolCalls: next.toolCalls ?? [],
      usage: { ...emptyTokenUsage(), promptTokens: 10, totalTokens: 12 },
    });
  }
}
