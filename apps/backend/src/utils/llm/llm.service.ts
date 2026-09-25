import { Injectable, Optional } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Options, default as retry } from 'async-retry';
import { z, ZodType } from 'zod';
import { ConcurrencyLimiter } from '../concurrency-limiter';
import { estimateRequestTokens } from './estimate-request-tokens';
import { LlmError } from './llm.errors';
import { LlmObserver } from './llm-observer';
import { ModelRateLimiters } from './model-rate-limiters';
import { LlmCapabilities, LlmImage, LlmTier } from './llm-tier';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
} from './repositories/llm.repository';
import { TokenUsage } from './token-usage';
import { isTransientError } from './is-transient-error';
import { parseStructuredResponse } from './parse-json-response';

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_OUTPUT_TOKENS = 64000;
const DEFAULT_THINKING_BUDGET = 8192;
// Un 429 malgré le lissage : le quota est compté autrement que prévu, on
// laisse la minute se vider un peu avant de réserver à nouveau.
const RATE_LIMIT_PENALTY_MS = 15_000;
// Jusqu'à une minute d'attente cumulée : les quotas se comptent souvent par
// minute (Albert API : requêtes et tokens par minute).
const RETRY_OPTIONS: Options = {
  retries: 6,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
  randomize: true,
};

type CommonArgs = {
  prompt: string;
  /** Palier de modèle, `strong` par défaut. */
  tier?: LlmTier;
  images?: LlmImage[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  signal?: AbortSignal;
};

export type GenerateStructuredArgs<Schema extends ZodType> = CommonArgs & {
  schema: Schema;
};

export type GenerateTextArgs = CommonArgs;

export type StructuredCompletion<Schema extends ZodType> = {
  data: z.output<Schema>;
  tokens: TokenUsage;
};

export type TextCompletion = {
  text: string;
  tokens: TokenUsage;
};

@Injectable()
export class LlmService {
  private readonly limiter: ConcurrencyLimiter;
  private readonly rateLimiters: ModelRateLimiters;

  constructor(
    private readonly llmRepository: LlmRepository,
    @Optional() private readonly observer?: LlmObserver
  ) {
    this.limiter = new ConcurrencyLimiter(llmRepository.maxConcurrentCalls);
    this.rateLimiters = new ModelRateLimiters(
      llmRepository.maxInputTokensPerMinute,
      llmRepository.maxRequestsPerMinute
    );
  }

  get capabilities(): LlmCapabilities {
    return this.llmRepository.capabilities;
  }

  get maxInputTokens(): number {
    return this.llmRepository.maxInputTokens;
  }

  maxInputTokensFor(tier: LlmTier): number {
    return this.llmRepository.maxInputTokensFor(tier);
  }

  async generateStructured<Schema extends ZodType>(
    args: GenerateStructuredArgs<Schema>
  ): Promise<Result<StructuredCompletion<Schema>, LlmError>> {
    return this.complete(
      { ...toRequest(args), jsonSchema: z.toJSONSchema(args.schema) },
      (completion) => toStructuredCompletion(completion, args.schema)
    );
  }

  /** Réponse en texte libre : transcription d'une page, par exemple. */
  async generateText(
    args: GenerateTextArgs
  ): Promise<Result<TextCompletion, LlmError>> {
    return this.complete(toRequest(args), toTextCompletion);
  }

  /**
   * `toResult` valide la réponse dans la tentative : une réponse tronquée ou
   * hors schéma est un appel en échec pour l'observateur, même quand l'API a
   * répondu.
   */
  private complete<T>(
    request: LlmCompletionRequest,
    toResult: (completion: LlmRawCompletion) => Result<T, LlmError>
  ): Promise<Result<T, LlmError>> {
    const promptChars =
      request.prompt.length + (request.systemInstruction?.length ?? 0);
    const estimatedTokens = estimateRequestTokens(request);
    const model = this.llmRepository.modelFor(request.tier) ?? request.tier;
    return this.callWithRetry(
      (attempt) =>
        this.limiter.run(async () => {
          // Réservé une fois le tour de file obtenu : le fournisseur compte la
          // requête à son envoi, pas à son entrée dans la file.
          const settle = await this.rateLimiters.acquire(
            model,
            estimatedTokens,
            request.signal
          );
          const startedAt = Date.now();
          const completion = await this.llmRepository.complete(request);
          settle(
            completion.success ? completion.data.usage.promptTokens : undefined
          );
          if (!completion.success && completion.error.kind === 'rate_limited') {
            this.rateLimiters.penalize(model, RATE_LIMIT_PENALTY_MS);
          }
          const result = completion.success
            ? toResult(completion.data)
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
      request.signal
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

const toRequest = (args: CommonArgs): LlmCompletionRequest => ({
  prompt: args.prompt,
  tier: args.tier ?? 'strong',
  images: args.images,
  systemInstruction: args.systemInstruction,
  temperature: args.temperature ?? DEFAULT_TEMPERATURE,
  maxOutputTokens: args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
  thinkingBudget: args.thinkingBudget ?? DEFAULT_THINKING_BUDGET,
  signal: args.signal,
});

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

const toTextCompletion = (
  completion: LlmRawCompletion
): Result<TextCompletion, LlmError> => {
  if (!completion.completed) {
    return failure({ kind: 'truncated' });
  }
  return success({ text: completion.text ?? '', tokens: completion.usage });
};
