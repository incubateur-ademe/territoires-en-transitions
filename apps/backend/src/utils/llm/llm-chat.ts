import { estimateTokenCount } from './estimate-token-count';
import { LlmReasoningEffort, LlmTier } from './llm-tier';
import { TokenUsage } from './token-usage';

/**
 * Conversation avec appels d'outils, dans un format neutre : chaque
 * fournisseur traduit ces messages dans le sien (OpenAI pour Albert,
 * `Content[]` pour Gemini).
 */
export type LlmToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  /** Arguments illisibles (JSON invalide) : à renvoyer au modèle en erreur. */
  argumentsError?: string;
};

export type LlmChatMessage =
  | { role: 'user'; text: string }
  | {
      role: 'assistant';
      text?: string;
      toolCalls: LlmToolCall[];
      /** Message tel que rendu par le fournisseur, à lui rejouer tel quel
       * (signatures de pensée de Gemini). Ignoré par les autres. */
      providerData?: unknown;
    }
  | { role: 'tool'; toolCallId: string; name: string; content: string };

export type LlmToolDefinition = {
  name: string;
  description: string;
  /** JSON Schema des arguments. */
  parameters: Record<string, unknown>;
};

export type LlmChatRequest = {
  tier: LlmTier;
  systemInstruction?: string;
  messages: LlmChatMessage[];
  tools: LlmToolDefinition[];
  /** `none` : le modèle doit répondre sans appeler d'outil (dernier tour). */
  toolChoice?: 'auto' | 'none';
  temperature?: number;
  maxOutputTokens?: number;
  reasoningEffort?: LlmReasoningEffort;
  signal?: AbortSignal;
};

export type LlmChatTurn = {
  /** Fin normale du tour : réponse finale ou demande d'appels d'outils. */
  completed: boolean;
  text?: string;
  toolCalls: LlmToolCall[];
  usage: TokenUsage;
  providerData?: unknown;
};

/** Tokens d'entrée d'un tour de conversation, estimés avant l'envoi. */
export const estimateChatTokens = (
  request: Pick<LlmChatRequest, 'systemInstruction' | 'messages' | 'tools'>
): number =>
  estimateTokenCount(
    (request.systemInstruction ?? '') +
      JSON.stringify(request.tools) +
      request.messages
        .map((message) =>
          message.role === 'assistant'
            ? (message.text ?? '') + JSON.stringify(message.toolCalls)
            : message.role === 'tool'
            ? message.content
            : message.text
        )
        .join('')
  );

/** Caractères de la conversation, pour le journal des appels. */
export const chatPromptChars = (
  request: Pick<LlmChatRequest, 'systemInstruction' | 'messages'>
): number =>
  (request.systemInstruction?.length ?? 0) +
  request.messages.reduce(
    (total, message) =>
      total +
      (message.role === 'tool'
        ? message.content.length
        : message.text?.length ?? 0),
    0
  );
