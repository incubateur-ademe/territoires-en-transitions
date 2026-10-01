import { Injectable, Optional } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Options, default as retry } from 'async-retry';
import { z, ZodType } from 'zod';
import { ConcurrencyLimiter } from '../concurrency-limiter';
import { LlmError } from './llm.errors';
import { LlmObserver } from './llm-observer';
import { LlmRawCompletion, LlmRepository } from './repositories/llm.repository';
import { TokenUsage } from './token-usage';
import { isTransientError } from './is-transient-error';
import { parseStructuredResponse } from './parse-json-response';

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_OUTPUT_TOKENS = 64000;
const DEFAULT_THINKING_BUDGET = 8192;
// Jusqu'à une minute d'attente cumulée : les quotas se comptent souvent par
// minute (Albert API : requêtes et tokens par minute).
const RETRY_OPTIONS: Options = {
  retries: 6,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
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
  private readonly limiter: ConcurrencyLimiter;

  constructor(
    private readonly llmRepository: LlmRepository,
    @Optional() private readonly observer?: LlmObserver
  ) {
    this.limiter = new ConcurrencyLimiter(llmRepository.maxConcurrentCalls);
  }

  get maxInputTokens(): number {
    return this.llmRepository.maxInputTokens;
  }

  async generateStructured<Schema extends ZodType>(
    args: GenerateStructuredArgs<Schema>
  ): Promise<Result<StructuredCompletion<Schema>, LlmError>> {
    const request = {
      prompt: args.prompt,
      jsonSchema: z.toJSONSchema(args.schema),
      systemInstruction: args.systemInstruction,
      temperature: args.temperature ?? DEFAULT_TEMPERATURE,
      maxOutputTokens: args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      thinkingBudget: args.thinkingBudget ?? DEFAULT_THINKING_BUDGET,
      signal: args.signal,
    };
    const promptChars =
      request.prompt.length + (request.systemInstruction?.length ?? 0);
    return this.callWithRetry(
      (attempt) =>
        this.limiter.run(async () => {
          // Mesuré une fois le tour de file obtenu : le temps d'attente du
          // limiteur n'est pas celui du modèle.
          const startedAt = Date.now();
          const completion = await this.llmRepository.complete(request);
          // Une réponse tronquée ou hors schéma est un appel en échec, même
          // quand l'API a répondu.
          const result = completion.success
            ? toStructuredCompletion(completion.data, args.schema)
            : completion;
          this.observer?.onCall({
            attempt,
            durationMs: Date.now() - startedAt,
            promptChars,
            usage: completion.success ? completion.data.usage : null,
            error: result.success ? null : result.error,
          });
          return result;
        }),
      args.signal
    );
  }

  private async callWithRetry<T>(
    call: (attempt: number) => Promise<Result<T, LlmError>>,
    signal?: AbortSignal
  ): Promise<Result<T, LlmError>> {
    let lastRetryableResult: Result<T, LlmError> | null = null;
    let attempt = 0;
    try {
      return await retry(async () => {
        attempt += 1;
        const result = await call(attempt);
        if (
          !result.success &&
          isTransientError(result.error) &&
          !signal?.aborted
        ) {
          lastRetryableResult = result;
          throw new Error(result.error.kind);
        }
        return result;
      }, RETRY_OPTIONS);
    } catch {
      return (
        lastRetryableResult ?? failure({ kind: 'api_error', httpStatus: null })
      );
    }
  }
}

const toStructuredCompletion = <Schema extends ZodType>(
  completion: LlmRawCompletion,
  schema: Schema
): Result<StructuredCompletion<Schema>, LlmError> => {
  const parsed = parseStructuredResponse({
    completed: completion.completed,
    text: completion.text,
    schema,
  });
  if (!parsed.success) {
    return parsed;
  }
  return success({ data: parsed.data, tokens: completion.usage });
};
