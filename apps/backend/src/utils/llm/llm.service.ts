import { Injectable } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Options, default as retry } from 'async-retry';
import { z, ZodType } from 'zod';
import { LlmError } from './llm.errors';
import {
  LlmRawCompletion,
  LlmRepository,
  TokenUsage,
} from './llm.repository';
import { parseStructuredResponse } from './parse-json-response';

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_OUTPUT_TOKENS = 64000;
const DEFAULT_THINKING_BUDGET = 8192;
const RETRY_OPTIONS: Options = {
  retries: 5,
  factor: 2,
  minTimeout: 500,
  maxTimeout: 8000,
  randomize: true,
};

export type GenerateStructuredArgs<Schema extends ZodType> = {
  prompt: string;
  schema: Schema;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  signal?: AbortSignal;
};

export type StructuredCompletion<Schema extends ZodType> = {
  data: z.output<Schema>;
  tokens: TokenUsage;
};

@Injectable()
export class LlmService {
  constructor(private readonly llmRepository: LlmRepository) {}

  async generateStructured<Schema extends ZodType>(
    args: GenerateStructuredArgs<Schema>
  ): Promise<Result<StructuredCompletion<Schema>, LlmError>> {
    const completionResult = await this.callWithRetry(() =>
      this.llmRepository.complete({
        prompt: args.prompt,
        jsonSchema: z.toJSONSchema(args.schema),
        systemInstruction: args.systemInstruction,
        temperature: args.temperature ?? DEFAULT_TEMPERATURE,
        maxOutputTokens: args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        thinkingBudget: args.thinkingBudget ?? DEFAULT_THINKING_BUDGET,
        signal: args.signal,
      })
    );
    if (!completionResult.success) {
      return completionResult;
    }

    const completion = completionResult.data;
    const parsed = parseStructuredResponse({
      completed: completion.completed,
      text: completion.text,
      schema: args.schema,
    });
    if (!parsed.success) {
      return parsed;
    }

    return success({ data: parsed.data, tokens: completion.usage });
  }

  private async callWithRetry(
    call: () => Promise<Result<LlmRawCompletion, LlmError>>
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    let lastRetryableResult: Result<LlmRawCompletion, LlmError> | null = null;
    try {
      return await retry(async () => {
        const result = await call();
        if (!result.success && isTransientError(result.error)) {
          lastRetryableResult = result;
          throw new Error(result.error.kind);
        }
        return result;
      }, RETRY_OPTIONS);
    } catch {
      return lastRetryableResult ?? failure({ kind: 'api_error', httpStatus: null });
    }
  }
}

export const isTransientError = (error: LlmError): boolean => {
  if (error.kind === 'rate_limited') {
    return true;
  }
  if (error.kind === 'api_error') {
    return error.httpStatus === null || error.httpStatus >= 500;
  }
  return false;
};
