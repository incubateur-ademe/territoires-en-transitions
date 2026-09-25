import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import OpenAI from 'openai';
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';
import type { CompletionUsage } from 'openai/resources/completions';
import { describeError } from '../describe-error';
import { LlmError } from '../../llm.errors';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
} from '../llm.repository';
import { TokenUsage } from '../../token-usage';

const CALL_TIMEOUT_MS = 9 * 60 * 1000;
// 503 « Model is too busy » : saturation passagère, comme un quota dépassé.
const RATE_LIMITED_STATUSES = new Set([429, 503]);

/**
 * Albert API, l'inférence du socle interministériel d'IA générative (DINUM),
 * appelée par le SDK OpenAI comme le recommande sa documentation. Aucun
 * équivalent de `thinkingBudget` : les tokens de raisonnement se prennent sur
 * `max_completion_tokens`.
 */
@Injectable()
export class AlbertRepository extends LlmRepository {
  readonly maxInputTokens: number;
  readonly maxConcurrentCalls: number;
  private readonly logger = new Logger(AlbertRepository.name);
  private readonly model: string | undefined;
  private readonly client: OpenAI | null;

  constructor(configService: ConfigurationService) {
    super();
    this.maxInputTokens = configService.get('ALBERT_MAX_INPUT_TOKENS');
    this.maxConcurrentCalls = configService.get('ALBERT_MAX_CONCURRENT_CALLS');
    this.model = configService.get('ALBERT_MODEL');
    const apiKey = configService.get('ALBERT_API_KEY');
    // Les reprises sont celles de LlmService, pas celles du SDK.
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: configService.get('ALBERT_API_BASE_URL'),
          maxRetries: 0,
          timeout: CALL_TIMEOUT_MS,
        })
      : null;
  }

  async complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    if (!this.client || !this.model) {
      this.logger.error(
        'ALBERT_API_KEY ou ALBERT_MODEL manquant : appel Albert impossible'
      );
      return failure({ kind: 'api_error', httpStatus: null });
    }

    this.logger.log(
      `Albert call (model ${this.model}, prompt ${
        request.prompt.length
      } chars, instruction ${request.systemInstruction?.length ?? 0} chars)`
    );

    try {
      const stream = await this.client.chat.completions.create(
        toChatCompletionParams(this.model, request),
        { signal: request.signal }
      );

      let text = '';
      let finishReason: string | undefined;
      let usage: CompletionUsage | undefined;
      for await (const chunk of stream) {
        for (const choice of chunk.choices) {
          text += choice.delta.content ?? '';
          finishReason = choice.finish_reason ?? finishReason;
        }
        usage = chunk.usage ?? usage;
      }

      const tokenUsage = toTokenUsage(usage);
      if (finishReason !== 'stop') {
        this.logger.warn(
          `Incomplete Albert response (model ${this.model}, finishReason ${
            finishReason ?? 'unknown'
          }, ${tokenUsage.candidatesTokens} tokens generated of ${
            request.maxOutputTokens
          } allowed)`
        );
      }

      return success({
        completed: finishReason === 'stop',
        text: text.length > 0 ? text : undefined,
        usage: tokenUsage,
      });
    } catch (error) {
      const httpStatus =
        error instanceof OpenAI.APIError ? error.status ?? null : null;
      this.logger.error(
        `Albert API error (model ${
          this.model
        }, status ${httpStatus}): ${describeError(error)}`
      );
      if (httpStatus !== null && RATE_LIMITED_STATUSES.has(httpStatus)) {
        return failure({ kind: 'rate_limited' });
      }
      return failure({ kind: 'api_error', httpStatus });
    }
  }
}

export const toChatCompletionParams = (
  model: string,
  request: LlmCompletionRequest
): ChatCompletionCreateParamsStreaming => ({
  model,
  messages: [
    ...(request.systemInstruction
      ? [{ role: 'system' as const, content: request.systemInstruction }]
      : []),
    { role: 'user', content: request.prompt },
  ],
  temperature: request.temperature,
  max_completion_tokens: request.maxOutputTokens,
  response_format: {
    type: 'json_schema',
    json_schema: { name: 'response', schema: request.jsonSchema },
  },
  stream: true,
  stream_options: { include_usage: true },
});

const toTokenUsage = (usage: CompletionUsage | undefined): TokenUsage => {
  const thoughtsTokens =
    usage?.completion_tokens_details?.reasoning_tokens ?? 0;
  return {
    promptTokens: usage?.prompt_tokens ?? 0,
    cachedTokens: usage?.prompt_tokens_details?.cached_tokens ?? 0,
    candidatesTokens: (usage?.completion_tokens ?? 0) - thoughtsTokens,
    thoughtsTokens,
    totalTokens: usage?.total_tokens ?? 0,
  };
};
