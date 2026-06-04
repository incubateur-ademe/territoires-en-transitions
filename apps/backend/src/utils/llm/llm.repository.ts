import { Result } from '@tet/backend/utils/result.type';
import { LlmError } from './llm.errors';

export type TokenUsage = {
  promptTokens: number;
  candidatesTokens: number;
  thoughtsTokens: number;
  totalTokens: number;
};

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
  abstract complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>>;
}
