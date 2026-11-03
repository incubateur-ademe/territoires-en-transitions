import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { omit } from 'es-toolkit';
import { LlmError } from '../../llm.errors';
import { LlmCapabilities, LlmTier } from '../../llm-tier';
import { TokenUsage } from '../../token-usage';
import { describeError } from '../describe-error';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
} from '../llm.repository';

const ANTHROPIC_MODEL = 'claude-haiku-5-5';
const CALL_TIMEOUT_MS = 2 * 60 * 1000;
const MAX_CONCURRENT_CALLS = 8;
const MAX_INPUT_TOKENS = 200_000;
const MAX_OUTPUT_TOKENS = 16_384;
const RATE_LIMITED_STATUSES = new Set([429, 503, 529]);
const COMPLETED_STOP_REASONS = new Set<Anthropic.StopReason | null>([
  'end_turn',
  'tool_use',
  'stop_sequence',
]);
const STRUCTURED_OUTPUT_TOOL_NAME = 'repondre';

@Injectable()
class AnthropicRepository extends LlmRepository {
  readonly maxConcurrentCalls = MAX_CONCURRENT_CALLS;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  readonly capabilities: LlmCapabilities = {
    ocr: false,
    strategy: 'segmented',
  };
  private readonly logger = new Logger(AnthropicRepository.name);
  private readonly client: Anthropic | null;

  constructor(configService: ConfigurationService) {
    super();
    const apiKey = configService.get('ANTHROPIC_API_KEY');
    this.client = apiKey
      ? new Anthropic({ apiKey, maxRetries: 0, timeout: CALL_TIMEOUT_MS })
      : null;
  }

  maxInputTokensFor(_tier: LlmTier): number {
    return MAX_INPUT_TOKENS;
  }

  modelFor(_tier: LlmTier): string {
    return ANTHROPIC_MODEL;
  }

  async complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    if (request.images?.length) {
      return failure({ kind: 'unsupported', feature: 'images' });
    }
    if (!this.client) {
      this.logger.error('ANTHROPIC_API_KEY is missing: cannot call Anthropic');
      return failure({ kind: 'api_error', httpStatus: null });
    }

    const timeout = request.timeoutMs ?? CALL_TIMEOUT_MS;
    this.logger.log(
      `Anthropic call (model ${ANTHROPIC_MODEL}, prompt ${request.prompt.length} chars, instruction ${request.systemInstruction?.length ?? 0} chars, timeout ${timeout} ms)`
    );

    try {
      const message = await this.client.messages.create(
        toAnthropicMessageParams(ANTHROPIC_MODEL, request),
        { signal: request.signal, timeout }
      );
      const completion = toRawCompletion(message);
      if (!completion.completed) {
        this.logger.warn(
          `Incomplete Anthropic response (model ${ANTHROPIC_MODEL}, stopReason ${
            message.stop_reason ?? 'unknown'
          }, ${completion.usage.candidatesTokens} tokens generated)`
        );
      }
      return success(completion);
    } catch (error) {
      const httpStatus =
        error instanceof Anthropic.APIError ? error.status ?? null : null;
      this.logger.error(
        `Anthropic API error (model ${ANTHROPIC_MODEL}, status ${httpStatus}): ${describeError(
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

const toAnthropicMessageParams = (
  model: string,
  request: LlmCompletionRequest
): Anthropic.MessageCreateParamsNonStreaming => ({
  model,
  max_tokens: Math.min(
    request.maxOutputTokens ?? MAX_OUTPUT_TOKENS,
    MAX_OUTPUT_TOKENS
  ),
  ...toSystemParams(request.systemInstruction),
  messages: [{ role: 'user', content: request.prompt }],
  ...toStructuredOutputParams(request.jsonSchema),
});

const toSystemParams = (
  systemInstruction: string | undefined
): Pick<Anthropic.MessageCreateParamsNonStreaming, 'system'> => {
  if (!systemInstruction) {
    return {};
  }
  return {
    system: [
      {
        type: 'text',
        text: systemInstruction,
        cache_control: { type: 'ephemeral' },
      },
    ],
  };
};

const toStructuredOutputParams = (
  jsonSchema: Record<string, unknown> | undefined
): Pick<
  Anthropic.MessageCreateParamsNonStreaming,
  'tools' | 'tool_choice'
> => {
  if (!jsonSchema) {
    return {};
  }
  return {
    tools: [
      {
        name: STRUCTURED_OUTPUT_TOOL_NAME,
        description: 'Renvoie la réponse structurée.',
        input_schema: { ...omit(jsonSchema, ['$schema']), type: 'object' },
        strict: true,
      },
    ],
    tool_choice: { type: 'tool', name: STRUCTURED_OUTPUT_TOOL_NAME },
  };
};

const toResponseText = (content: Anthropic.ContentBlock[]): string => {
  const toolUse = content.find((block) => block.type === 'tool_use');
  if (toolUse) {
    return JSON.stringify(toolUse.input);
  }
  return content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('');
};

const toRawCompletion = (message: Anthropic.Message): LlmRawCompletion => {
  const text = toResponseText(message.content);

  return {
    completed: COMPLETED_STOP_REASONS.has(message.stop_reason),
    text: text.length > 0 ? text : undefined,
    usage: toTokenUsage(message.usage),
  };
};

const toTokenUsage = (usage: Anthropic.Usage): TokenUsage => {
  const cachedTokens = usage.cache_read_input_tokens ?? 0;
  const promptTokens =
    usage.input_tokens +
    cachedTokens +
    (usage.cache_creation_input_tokens ?? 0);

  return {
    promptTokens,
    cachedTokens,
    candidatesTokens: usage.output_tokens,
    thoughtsTokens: 0,
    totalTokens: promptTokens + usage.output_tokens,
  };
};

export { AnthropicRepository, toAnthropicMessageParams };
