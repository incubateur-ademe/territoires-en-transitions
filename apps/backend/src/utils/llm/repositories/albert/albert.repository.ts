import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import OpenAI from 'openai';
import type {
  ChatCompletionContentPart,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions';
import type { CompletionUsage } from 'openai/resources/completions';
import { describeError } from '../describe-error';
import { LlmError } from '../../llm.errors';
import { LlmCapabilities, LlmTier } from '../../llm-tier';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
} from '../llm.repository';
import { TokenUsage } from '../../token-usage';

const CALL_TIMEOUT_MS = 9 * 60 * 1000;
// 503 « Model is too busy » : saturation passagère, comme un quota dépassé.
const RATE_LIMITED_STATUSES = new Set([429, 503]);

// Fenêtres : ministral 262 144 tokens, lightonocr 16 384 (une page à la fois).
// Le palier fort garde sa marge configurable pour loger la réponse.
const LIGHT_MAX_INPUT_TOKENS = 100_000;
const OCR_MAX_INPUT_TOKENS = 8_000;

/**
 * Albert API, l'inférence du socle interministériel d'IA générative (DINUM),
 * appelée par le SDK OpenAI comme le recommande sa documentation. Aucun
 * équivalent de `thinkingBudget` : les tokens de raisonnement se prennent sur
 * `max_completion_tokens`.
 */
@Injectable()
export class AlbertRepository extends LlmRepository {
  readonly maxConcurrentCalls: number;
  readonly maxInputTokensPerMinute: number;
  readonly maxRequestsPerMinute: number;
  readonly capabilities: LlmCapabilities;
  private readonly logger = new Logger(AlbertRepository.name);
  private readonly models: Record<LlmTier, string | undefined>;
  private readonly strongMaxInputTokens: number;
  private readonly client: OpenAI | null;

  constructor(configService: ConfigurationService) {
    super();
    this.strongMaxInputTokens = configService.get('ALBERT_MAX_INPUT_TOKENS');
    this.maxConcurrentCalls = configService.get('ALBERT_MAX_CONCURRENT_CALLS');
    this.maxInputTokensPerMinute = configService.get(
      'ALBERT_MAX_INPUT_TOKENS_PER_MINUTE'
    );
    this.maxRequestsPerMinute = configService.get(
      'ALBERT_MAX_REQUESTS_PER_MINUTE'
    );
    // Un palier sans modèle propre retombe sur le palier fort ; l'OCR, lui,
    // exige un modèle image-texte : vide, il est désactivé.
    const strong = configService.get('ALBERT_MODEL');
    this.models = {
      strong,
      light: configService.get('ALBERT_MODEL_LIGHT') || strong,
      ocr: configService.get('ALBERT_MODEL_OCR') || undefined,
    };
    this.capabilities = {
      ocr: this.models.ocr !== undefined,
      strategy: 'segmented',
    };
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

  maxInputTokensFor(tier: LlmTier): number {
    switch (tier) {
      case 'strong':
        return this.strongMaxInputTokens;
      case 'light':
        return LIGHT_MAX_INPUT_TOKENS;
      case 'ocr':
        return OCR_MAX_INPUT_TOKENS;
    }
  }

  modelFor(tier: LlmTier): string | undefined {
    return this.models[tier];
  }

  async complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    const model = this.modelFor(request.tier);
    if (!this.client || !model) {
      this.logger.error(
        `ALBERT_API_KEY ou modèle du palier ${request.tier} manquant : appel Albert impossible`
      );
      return failure({ kind: 'api_error', httpStatus: null });
    }

    this.logger.log(
      `Albert call (model ${model}, prompt ${
        request.prompt.length
      } chars, instruction ${request.systemInstruction?.length ?? 0} chars${
        request.images?.length ? `, ${request.images.length} image(s)` : ''
      })`
    );

    try {
      const stream = await this.client.chat.completions.create(
        toChatCompletionParams(model, request),
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
          `Incomplete Albert response (model ${model}, finishReason ${
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
        `Albert API error (model ${model}, status ${httpStatus}): ${describeError(
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

export const toChatCompletionParams = (
  model: string,
  request: LlmCompletionRequest
): ChatCompletionCreateParamsStreaming => ({
  model,
  messages: [
    ...(request.systemInstruction
      ? [{ role: 'system' as const, content: request.systemInstruction }]
      : []),
    { role: 'user', content: toUserContent(request) },
  ],
  temperature: request.temperature,
  max_completion_tokens: request.maxOutputTokens,
  ...(request.jsonSchema
    ? {
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'response', schema: request.jsonSchema },
        },
      }
    : {}),
  stream: true,
  stream_options: { include_usage: true },
});

const toUserContent = (
  request: LlmCompletionRequest
): string | ChatCompletionContentPart[] => {
  if (!request.images?.length) {
    return request.prompt;
  }
  return [
    { type: 'text', text: request.prompt },
    ...request.images.map(
      (image): ChatCompletionContentPart => ({
        type: 'image_url',
        image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
      })
    ),
  ];
};

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
