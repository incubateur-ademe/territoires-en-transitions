import { Injectable, Logger, Optional } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { z, ZodType } from 'zod';
import { ConcurrencyLimiter } from '../concurrency-limiter';
import { sleep } from '../sleep.utils';
import { estimateRequestTokens } from './estimate-request-tokens';
import { describeLlmError, LlmError } from './llm.errors';
import { currentLlmCallRecorder } from './llm-call-recorder';
import { LlmCallEvent, LlmObserver } from './llm-observer';
import { ModelRateLimiters } from './model-rate-limiters';
import {
  LlmCapabilities,
  LlmImage,
  LlmReasoningEffort,
  LlmTier,
} from './llm-tier';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
  LlmRetryOptions,
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
const MAX_ATTEMPTS_WITHOUT_HTTP_STATUS = 3;
// Jusqu'à une minute d'attente cumulée : les quotas se comptent souvent par
// minute (Albert API : requêtes et tokens par minute). Un fournisseur peut
// attendre plus longtemps après un 429 (`rateLimitedRetryOptions`).
const RETRY_OPTIONS: LlmRetryOptions = {
  retries: 6,
  minTimeout: 1000,
  maxTimeout: 30000,
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
  timeoutMs?: number;
  reasoningEffort?: LlmReasoningEffort;
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
  private readonly logger = new Logger(LlmService.name);
  private readonly limiter: ConcurrencyLimiter;
  private readonly rateLimiters: ModelRateLimiters;
  private readonly rateLimitedRetryOptions: LlmRetryOptions;

  constructor(
    private readonly llmRepository: LlmRepository,
    @Optional() private readonly observer?: LlmObserver
  ) {
    this.limiter = new ConcurrencyLimiter(llmRepository.maxConcurrentCalls);
    this.rateLimiters = new ModelRateLimiters(
      llmRepository.maxInputTokensPerMinute,
      llmRepository.maxRequestsPerMinute
    );
    this.rateLimitedRetryOptions =
      llmRepository.rateLimitedRetryOptions ?? RETRY_OPTIONS;
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
    const recorder = currentLlmCallRecorder();
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
          const event: LlmCallEvent = {
            tier: request.tier,
            model,
            attempt,
            durationMs: Date.now() - startedAt,
            promptChars,
            usage: completion.success ? completion.data.usage : null,
            error: result.success ? null : result.error,
          };
          this.observer?.onCall(event);
          recorder?.calls.push(event);
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
    let attemptsWithoutHttpStatus = 0;
    for (let attempt = 1; ; attempt += 1) {
      let options = RETRY_OPTIONS;
      try {
        const result = await call(attempt);
        if (
          result.success ||
          !isTransientError(result.error) ||
          signal?.aborted
        ) {
          return result;
        }
        lastRetryableResult = result;
        if (result.error.kind === 'rate_limited') {
          options = this.rateLimitedRetryOptions;
        }
        if (hasNoHttpStatus(result.error)) {
          attemptsWithoutHttpStatus += 1;
        }
        if (attemptsWithoutHttpStatus >= MAX_ATTEMPTS_WITHOUT_HTTP_STATUS) {
          this.logger.warn(
            `LLM call abandoned after ${attempt} attempts, ${attemptsWithoutHttpStatus} without HTTP status (${describeLlmError(
              result.error
            )})`
          );
          return result;
        }
        if (attempt <= options.retries) {
          this.logger.warn(
            `LLM call attempt ${attempt} failed (${describeLlmError(
              result.error
            )}), retrying`
          );
        }
      } catch (error) {
        // L'attente du limiteur rejette quand l'appel est annulé : ne pas
        // rejouer, et laisser l'annulation visible de l'appelant.
        if (signal?.aborted) {
          throw error;
        }
      }
      if (attempt > options.retries) {
        return (
          lastRetryableResult ??
          failure({ kind: 'api_error', httpStatus: null })
        );
      }
      await sleep(retryDelayMs(options, attempt), signal);
    }
  }
}

const hasNoHttpStatus = (error: LlmError): boolean =>
  error.kind === 'api_error' && error.httpStatus === null;

// Backoff exponentiel aléatoire, à la manière d'async-retry : les appels
// refusés ensemble ne reviennent pas ensemble.
const retryDelayMs = (
  { minTimeout, maxTimeout }: LlmRetryOptions,
  attempt: number
): number =>
  Math.min(
    Math.round((1 + Math.random()) * minTimeout * 2 ** (attempt - 1)),
    maxTimeout
  );

const toRequest = (args: CommonArgs): LlmCompletionRequest => ({
  prompt: args.prompt,
  tier: args.tier ?? 'strong',
  images: args.images,
  systemInstruction: args.systemInstruction,
  temperature: args.temperature ?? DEFAULT_TEMPERATURE,
  maxOutputTokens: args.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
  thinkingBudget: args.thinkingBudget ?? DEFAULT_THINKING_BUDGET,
  timeoutMs: args.timeoutMs,
  reasoningEffort: args.reasoningEffort,
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
