import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import OpenAI from 'openai';
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';
import type { CompletionUsage } from 'openai/resources/completions';
import { LlmError } from '../../llm.errors';
import { LlmCapabilities, LlmTier } from '../../llm-tier';
import { TokenUsage } from '../../token-usage';
import { describeError } from '../describe-error';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
} from '../llm.repository';

const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';
const MISTRAL_MODEL = 'mistral-large-4-0';
const CALL_TIMEOUT_MS = 2 * 60 * 1000;
const MAX_CONCURRENT_CALLS = 5;
const MAX_INPUT_TOKENS = 100_000;
const MAX_OUTPUT_TOKENS = 16_384;
const RATE_LIMITED_STATUSES = new Set([429, 503]);

@Injectable()
export class MistralRepository extends LlmRepository {
  readonly maxConcurrentCalls = MAX_CONCURRENT_CALLS;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  readonly capabilities: LlmCapabilities = {
    ocr: false,
    strategy: 'segmented',
  };
  private readonly logger = new Logger(MistralRepository.name);
  private readonly client: OpenAI | null;

  constructor(configService: ConfigurationService) {
    super();
    const apiKey = configService.get('MISTRAL_API_KEY');
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: MISTRAL_BASE_URL,
          maxRetries: 0,
          timeout: CALL_TIMEOUT_MS,
        })
      : null;
  }

  maxInputTokensFor(_tier: LlmTier): number {
    return MAX_INPUT_TOKENS;
  }

  modelFor(_tier: LlmTier): string {
    return MISTRAL_MODEL;
  }

  async complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    if (request.images?.length) {
      return failure({ kind: 'unsupported', feature: 'images' });
    }
    if (!this.client) {
      this.logger.error('MISTRAL_API_KEY manquante : appel Mistral impossible');
      return failure({ kind: 'api_error', httpStatus: null });
    }

    const timeout = request.timeoutMs ?? CALL_TIMEOUT_MS;
    this.logger.log(
      `Mistral call (model ${MISTRAL_MODEL}, prompt ${request.prompt.length} chars, instruction ${request.systemInstruction?.length ?? 0} chars, timeout ${timeout} ms)`
    );

    try {
      const stream = await this.client.chat.completions.create(
        toMistralChatParams(MISTRAL_MODEL, request),
        { signal: request.signal, timeout }
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
          `Incomplete Mistral response (model ${MISTRAL_MODEL}, finishReason ${
            finishReason ?? 'unknown'
          }, ${tokenUsage.candidatesTokens} tokens generated)`
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
        `Mistral API error (model ${MISTRAL_MODEL}, status ${httpStatus}): ${describeError(
          error
        )}`
      );
      if (httpStatus !== null && RATE_LIMITED_STATUSES.has(httpStatus)) {
        return failure({ kind: 'rate_limited' });
      }
      return failure({ kind: 'api_error', httpStatus });
    }
  }
}

export const toMistralChatParams = (
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
  max_tokens:
    request.maxOutputTokens === undefined
      ? MAX_OUTPUT_TOKENS
      : Math.min(request.maxOutputTokens, MAX_OUTPUT_TOKENS),
  reasoning_effort: 'none',
  ...(request.jsonSchema
    ? {
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'response', schema: request.jsonSchema },
        },
      }
    : {}),
  stream: true,
});

const toTokenUsage = (usage: CompletionUsage | undefined): TokenUsage => ({
  promptTokens: usage?.prompt_tokens ?? 0,
  cachedTokens: usage?.prompt_tokens_details?.cached_tokens ?? 0,
  candidatesTokens: usage?.completion_tokens ?? 0,
  thoughtsTokens: 0,
  totalTokens: usage?.total_tokens ?? 0,
});
