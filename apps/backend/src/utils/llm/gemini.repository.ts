import { Injectable, Logger } from '@nestjs/common';
import {
  FinishReason,
  GenerateContentResponseUsageMetadata,
  GoogleGenAI,
} from '@google/genai';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { LlmError } from './llm.errors';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
  TokenUsage,
} from './llm.repository';

const CALL_TIMEOUT_MS = 9 * 60 * 1000;
const RATE_LIMITED_STATUSES = new Set([429, 503]);

@Injectable()
export class GeminiRepository extends LlmRepository {
  private readonly logger = new Logger(GeminiRepository.name);
  private readonly model: string | undefined;
  private client: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigurationService) {
    super();
    this.model = configService.get('GEMINI_MODEL');
  }

  async complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    const client = this.getClient();
    if (!client) {
      this.logger.error('GOOGLE_API_KEY manquant : appel Gemini impossible');
      return failure({ kind: 'api_error', httpStatus: null });
    }
    if (!this.model) {
      this.logger.error('GEMINI_MODEL manquant : appel Gemini impossible');
      return failure({ kind: 'api_error', httpStatus: null });
    }

    this.logger.log(
      `Gemini call (model ${this.model}, prompt ${request.prompt.length} chars, instruction ${request.systemInstruction?.length ?? 0} chars)`
    );

    try {
      const stream = await client.models.generateContentStream({
        model: this.model,
        contents: request.prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: request.jsonSchema,
          systemInstruction: request.systemInstruction,
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          thinkingConfig:
            request.thinkingBudget === undefined
              ? undefined
              : { thinkingBudget: request.thinkingBudget },
          httpOptions: { timeout: CALL_TIMEOUT_MS },
          abortSignal: request.signal,
        },
      });

      let text = '';
      let finishReason: FinishReason | undefined;
      let usageMetadata: GenerateContentResponseUsageMetadata | undefined;

      for await (const chunk of stream) {
        if (chunk.text !== undefined) {
          text += chunk.text;
        }
        const chunkFinishReason = chunk.candidates?.[0]?.finishReason;
        if (chunkFinishReason !== undefined) {
          finishReason = chunkFinishReason;
        }
        if (chunk.usageMetadata !== undefined) {
          usageMetadata = chunk.usageMetadata;
        }
      }

      const usage = toTokenUsage(usageMetadata);
      if (finishReason !== FinishReason.STOP) {
        this.logger.warn(
          `Incomplete Gemini response (model ${this.model}, finishReason ${
            finishReason ?? 'unknown'
          }, ${usage.candidatesTokens} tokens generated of ${
            request.maxOutputTokens
          } allowed)`
        );
      }

      return success({
        completed: finishReason === FinishReason.STOP,
        text: text.length > 0 ? text : undefined,
        usage,
      });
    } catch (error) {
      const httpStatus = extractHttpStatus(error);
      this.logger.error(
        `Gemini API error (model ${this.model}, status ${httpStatus}): ${describeError(
          error
        )}`
      );
      if (httpStatus !== null && RATE_LIMITED_STATUSES.has(httpStatus)) {
        return failure({ kind: 'rate_limited' });
      }
      return failure({ kind: 'api_error', httpStatus });
    }
  }

  private getClient(): GoogleGenAI | null {
    if (this.client) {
      return this.client;
    }
    const apiKey = this.configService.get('GOOGLE_API_KEY');
    if (!apiKey) {
      return null;
    }
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }
}

const toTokenUsage = (
  usage: GenerateContentResponseUsageMetadata | undefined
): TokenUsage => ({
  promptTokens: usage?.promptTokenCount ?? 0,
  candidatesTokens: usage?.candidatesTokenCount ?? 0,
  thoughtsTokens: usage?.thoughtsTokenCount ?? 0,
  totalTokens: usage?.totalTokenCount ?? 0,
});

const extractHttpStatus = (error: unknown): number | null => {
  if (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    return error.status;
  }
  return null;
};

const describeError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const { cause } = error;
  if (cause instanceof Error) {
    const code = errorCode(cause);
    const prefix = code === null ? '' : `${code} `;
    return `${error.message} — cause: ${prefix}${cause.message}`;
  }
  return error.message;
};

const errorCode = (error: Error): string | null =>
  'code' in error && typeof error.code === 'string' ? error.code : null;
