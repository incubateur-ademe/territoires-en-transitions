import { Injectable, Logger } from '@nestjs/common';
import {
  Content,
  FinishReason,
  FunctionCallingConfigMode,
  GenerateContentResponseUsageMetadata,
  GoogleGenAI,
  Part,
  ThinkingConfig,
  ThinkingLevel,
} from '@google/genai';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { createHash, randomUUID } from 'node:crypto';
import { describeError } from '../describe-error';
import {
  LlmChatMessage,
  LlmChatRequest,
  LlmChatTurn,
  LlmToolCall,
} from '../../llm-chat';
import { LlmError } from '../../llm.errors';
import { LlmCapabilities, LlmThinkingLevel, LlmTier } from '../../llm-tier';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
  LlmRetryOptions,
} from '../llm.repository';
import { TokenUsage } from '../../token-usage';

const CALL_TIMEOUT_MS = 9 * 60 * 1000;
const RATE_LIMITED_STATUSES = new Set([429, 503]);
const CALL_ID_LENGTH = 8;
const PROMPT_FINGERPRINT_LENGTH = 8;

@Injectable()
export class GeminiRepository extends LlmRepository {
  readonly maxConcurrentCalls = 20;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  // Quota partagé et inconnu : une saturation peut durer plusieurs minutes,
  // qu'on attend (environ 7 min cumulées) plutôt que de perdre l'étape.
  readonly rateLimitedRetryOptions: LlmRetryOptions = {
    retries: 8,
    minTimeout: 5_000,
    maxTimeout: 90_000,
  };
  // Un seul modèle, capable de lire un document entier : pas de paliers.
  readonly capabilities: LlmCapabilities = {
    ocr: false,
    strategy: 'whole-document',
  };
  private readonly logger = new Logger(GeminiRepository.name);
  private readonly model: string | undefined;
  private client: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigurationService) {
    super();
    this.model = configService.get('GEMINI_MODEL');
  }

  // Contexte d'un million de tokens, sortie maximale de 65 536.
  maxInputTokensFor(_tier: LlmTier): number {
    return 900_000;
  }

  modelFor(_tier: LlmTier): string | undefined {
    return this.model;
  }

  async complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
    if (request.images?.length) {
      return failure({ kind: 'unsupported', feature: 'images' });
    }
    const client = this.getClient();
    if (!client) {
      this.logger.error(
        'Ni GOOGLE_API_KEY ni GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION : appel Gemini impossible'
      );
      return failure({ kind: 'api_error', httpStatus: null });
    }
    if (!this.model) {
      this.logger.error('GEMINI_MODEL manquant : appel Gemini impossible');
      return failure({ kind: 'api_error', httpStatus: null });
    }

    const callId = randomUUID().slice(0, CALL_ID_LENGTH);
    const timeoutMs = request.timeoutMs ?? CALL_TIMEOUT_MS;
    const startedAt = Date.now();
    let firstChunkAfterMs: number | undefined;
    let chunkCount = 0;

    this.logger.log(
      `Gemini call ${callId} (model ${this.model}, prompt ${
        request.prompt.length
      } chars #${toPromptFingerprint(request.prompt)}, instruction ${
        request.systemInstruction?.length ?? 0
      } chars, timeout ${timeoutMs} ms)`
    );

    try {
      const stream = await client.models.generateContentStream({
        model: this.model,
        contents: request.prompt,
        config: {
          ...(request.jsonSchema
            ? {
                responseMimeType: 'application/json',
                responseJsonSchema: request.jsonSchema,
              }
            : {}),
          systemInstruction: request.systemInstruction,
          maxOutputTokens: request.maxOutputTokens,
          thinkingConfig: toThinkingConfig(request.thinkingLevel),
          httpOptions: { timeout: timeoutMs },
          abortSignal: request.signal,
        },
      });

      let text = '';
      let finishReason: FinishReason | undefined;
      let usageMetadata: GenerateContentResponseUsageMetadata | undefined;

      for await (const chunk of stream) {
        if (firstChunkAfterMs === undefined) {
          firstChunkAfterMs = Date.now() - startedAt;
        }
        chunkCount += 1;
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

      this.logger.debug(
        `Gemini response ${callId} (first chunk after ${
          firstChunkAfterMs ?? 'n/a'
        } ms, total ${Date.now() - startedAt} ms, ${chunkCount} ${
          chunkCount === 1 ? 'chunk' : 'chunks'
        }, finishReason ${finishReason ?? 'unknown'})`
      );

      const usage = toTokenUsage(usageMetadata);
      if (finishReason !== FinishReason.STOP) {
        this.logger.warn(
          `Incomplete Gemini response ${callId} (model ${
            this.model
          }, finishReason ${finishReason ?? 'unknown'}, ${
            usage.candidatesTokens
          } tokens generated of ${request.maxOutputTokens} allowed)`
        );
      }

      return success({
        completed: finishReason === FinishReason.STOP,
        text: text.length > 0 ? text : undefined,
        usage,
      });
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      if (isAbortError(error)) {
        this.logger.warn(
          toAbortMessage({
            callId,
            elapsedMs,
            timeoutMs,
            cancelledByCaller: request.signal?.aborted === true,
            chunkCount,
          })
        );
        return failure({ kind: 'api_error', httpStatus: null });
      }
      const httpStatus = extractHttpStatus(error);
      this.logger.error(
        `Gemini API error (model ${
          this.model
        }, status ${httpStatus}, call ${callId}, after ${elapsedMs} ms): ${describeError(
          error
        )}`
      );
      if (httpStatus !== null && RATE_LIMITED_STATUSES.has(httpStatus)) {
        return failure({ kind: 'rate_limited' });
      }
      return failure({ kind: 'api_error', httpStatus });
    }
  }

  /**
   * Tour de conversation avec outils. Le contenu rendu par le modèle est
   * gardé tel quel (`providerData`) et rejoué sans modification : Gemini 3
   * exige ses signatures de pensée au tour suivant.
   */
  async chat(request: LlmChatRequest): Promise<Result<LlmChatTurn, LlmError>> {
    const client = this.getClient();
    if (!client || !this.model) {
      this.logger.error(
        'Client ou GEMINI_MODEL manquant : appel Gemini impossible'
      );
      return failure({ kind: 'api_error', httpStatus: null });
    }

    const callId = randomUUID().slice(0, CALL_ID_LENGTH);
    const startedAt = Date.now();
    this.logger.log(
      `Gemini chat ${callId} (model ${this.model}, ${request.messages.length} messages, ${request.tools.length} tools)`
    );

    try {
      const response = await client.models.generateContent({
        model: this.model,
        contents: toGeminiContents(request.messages),
        config: {
          systemInstruction: request.systemInstruction,
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          ...(request.tools.length > 0
            ? {
                tools: [
                  {
                    functionDeclarations: request.tools.map((tool) => ({
                      name: tool.name,
                      description: tool.description,
                      parametersJsonSchema: tool.parameters,
                    })),
                  },
                ],
                toolConfig: {
                  functionCallingConfig: {
                    mode:
                      request.toolChoice === 'none'
                        ? FunctionCallingConfigMode.NONE
                        : FunctionCallingConfigMode.AUTO,
                  },
                },
              }
            : {}),
          httpOptions: { timeout: CALL_TIMEOUT_MS },
          abortSignal: request.signal,
        },
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];
      const toolCalls = parts.flatMap((part, index): LlmToolCall[] =>
        part.functionCall?.name
          ? [
              {
                id:
                  part.functionCall.id ?? `${part.functionCall.name}-${index}`,
                name: part.functionCall.name,
                arguments: part.functionCall.args ?? {},
              },
            ]
          : []
      );
      const text = parts
        .filter((part) => part.text && !part.thought)
        .map((part) => part.text)
        .join('');
      const completed = candidate?.finishReason === FinishReason.STOP;
      if (!completed) {
        this.logger.warn(
          `Incomplete Gemini chat ${callId} (finishReason ${
            candidate?.finishReason ?? 'unknown'
          }, after ${Date.now() - startedAt} ms)`
        );
      }
      return success({
        completed,
        text: text.length > 0 ? text : undefined,
        toolCalls,
        usage: toTokenUsage(response.usageMetadata),
        providerData: candidate?.content,
      });
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      if (isAbortError(error)) {
        this.logger.warn(`Gemini chat ${callId} aborted after ${elapsedMs} ms`);
        return failure({ kind: 'api_error', httpStatus: null });
      }
      const httpStatus = extractHttpStatus(error);
      this.logger.error(
        `Gemini chat error (model ${
          this.model
        }, status ${httpStatus}, call ${callId}, after ${elapsedMs} ms): ${describeError(
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
    const project = this.configService.get('GOOGLE_CLOUD_PROJECT');
    const location = this.configService.get('GOOGLE_CLOUD_LOCATION');
    // Vertex d'abord : sa région fixe le lieu du traitement, qu'une clé API
    // restée dans l'environnement ne doit pas contourner.
    if (project && location) {
      this.client = new GoogleGenAI({ vertexai: true, project, location });
    } else if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    } else {
      return null;
    }
    return this.client;
  }
}

/**
 * Messages neutres vers `Content[]` : les réponses d'outils consécutives
 * forment un seul message `user`, les tours du modèle sont rejoués tels quels
 * quand le fournisseur les a fournis.
 */
export const toGeminiContents = (messages: LlmChatMessage[]): Content[] => {
  const contents: Content[] = [];
  for (const message of messages) {
    if (message.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: message.text }] });
      continue;
    }
    if (message.role === 'assistant') {
      const replayed = message.providerData as Content | undefined;
      contents.push(
        replayed?.parts
          ? { role: 'model', parts: replayed.parts }
          : {
              role: 'model',
              parts: [
                ...(message.text ? [{ text: message.text }] : []),
                ...message.toolCalls.map(
                  (call): Part => ({
                    functionCall: {
                      id: call.id,
                      name: call.name,
                      args: call.arguments,
                    },
                  })
                ),
              ],
            }
      );
      continue;
    }
    const part: Part = {
      functionResponse: {
        id: message.toolCallId,
        name: message.name,
        response: { result: message.content },
      },
    };
    const previous = contents.at(-1);
    if (
      previous?.role === 'user' &&
      previous.parts?.every((p) => p.functionResponse)
    ) {
      previous.parts.push(part);
    } else {
      contents.push({ role: 'user', parts: [part] });
    }
  }
  return contents;
};

const THINKING_LEVELS: Record<LlmThinkingLevel, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

const toThinkingConfig = (
  thinkingLevel: LlmThinkingLevel | undefined
): ThinkingConfig | undefined =>
  thinkingLevel === undefined
    ? undefined
    : { thinkingLevel: THINKING_LEVELS[thinkingLevel] };

const toTokenUsage = (
  usage: GenerateContentResponseUsageMetadata | undefined
): TokenUsage => ({
  promptTokens: usage?.promptTokenCount ?? 0,
  cachedTokens: usage?.cachedContentTokenCount ?? 0,
  candidatesTokens: usage?.candidatesTokenCount ?? 0,
  thoughtsTokens: usage?.thoughtsTokenCount ?? 0,
  totalTokens: usage?.totalTokenCount ?? 0,
});

const toPromptFingerprint = (prompt: string): string =>
  createHash('sha256')
    .update(prompt)
    .digest('hex')
    .slice(0, PROMPT_FINGERPRINT_LENGTH);

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

const toAbortMessage = ({
  callId,
  elapsedMs,
  timeoutMs,
  cancelledByCaller,
  chunkCount,
}: {
  callId: string;
  elapsedMs: number;
  timeoutMs: number;
  cancelledByCaller: boolean;
  chunkCount: number;
}): string => {
  if (cancelledByCaller) {
    return `Gemini call ${callId} cancelled by caller after ${elapsedMs} ms`;
  }
  const progress =
    chunkCount === 0
      ? 'no response received'
      : `stream stalled after ${chunkCount} ${
          chunkCount === 1 ? 'chunk' : 'chunks'
        }`;
  return `Gemini call ${callId} timed out after ${elapsedMs} ms (limit ${timeoutMs} ms, ${progress})`;
};

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
