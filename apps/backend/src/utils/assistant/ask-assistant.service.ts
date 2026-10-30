import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import {
  LlmChatMessage,
  LlmToolCall,
  LlmToolDefinition,
} from '@tet/backend/utils/llm/llm-chat';
import { describeLlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { LlmTier } from '@tet/backend/utils/llm/llm-tier';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { BuildMcpServerService } from '@tet/backend/utils/mcp/build-mcp-server.service';
import {
  MCP_ANALYSE_STATS_PROMPT_NAME,
  MCP_ESQUISSE_PROMPT_NAME,
  MCP_SUPPORT_PROMPT_NAME,
} from '@tet/backend/utils/mcp/mcp-docs.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { AskAssistantError } from './ask-assistant.errors';
import {
  AskAssistantInput,
  askAssistantInputSchema,
  AskAssistantParsedInput,
} from './ask-assistant.input';
import { McpSession } from './mcp-session';

/** Appels d'outils exécutés par tour ; les suivants sont refusés au modèle. */
const MAX_TOOL_CALLS_PER_TURN = 4;
/** Résultat d'outil rendu au modèle, au-delà tronqué. */
const MAX_TOOL_RESULT_CHARS = 8_000;
const RESULT_PREVIEW_CHARS = 300;

const LAST_TURN_INSTRUCTION =
  "Limite d'appels d'outils atteinte. Réponds maintenant avec ce que tu as obtenu, sans appeler d'outil, et dis clairement ce qui manque.";

/**
 * Profil de l'utilisateur de la conversation, lu par `find_user` avec les
 * droits du support, et ses derniers messages : le modèle n'a pas à les
 * chercher.
 */
const buildSupportContext = async (
  session: McpSession,
  {
    visitorEmail,
    visitorMessages,
  }: NonNullable<AskAssistantParsedInput['support']>
): Promise<string> => {
  const profile = visitorEmail
    ? await session.callTool('find_user', { email: visitorEmail })
    : null;
  return [
    'Contexte de la conversation (fourni par le système) :',
    visitorEmail
      ? `- Utilisateur : ${visitorEmail}`
      : "- Utilisateur : adresse e-mail inconnue, la conversation n'est pas rattachée à un compte.",
    ...(profile
      ? [
          profile.isError
            ? `- Profil TeT : introuvable (${profile.text})`
            : `- Profil TeT (find_user) :\n${profile.text}`,
        ]
      : []),
    ...(visitorMessages.length
      ? [
          '- Ses derniers messages, du plus ancien au plus récent :',
          ...visitorMessages.map(
            (message) => `  > ${message.replace(/\n/g, ' ')}`
          ),
        ]
      : []),
  ].join('\n');
};

/** Le modèle n'a rien écrit : on dit au moins ce qui a été tenté. */
const fallbackAnswer = (traces: AssistantToolCallTrace[]): string => {
  const failed = traces.filter((trace) => trace.isError);
  return [
    "Je n'ai pas pu formuler de réponse.",
    traces.length
      ? `Outils appelés : ${[...new Set(traces.map((t) => t.name))].join(
          ', '
        )}.`
      : "Aucun outil n'a été appelé.",
    ...failed
      .slice(0, 3)
      .map((trace) => `Erreur de ${trace.name} : ${trace.resultPreview}`),
  ].join('\n');
};

export type AssistantToolCallTrace = {
  name: string;
  arguments: Record<string, unknown>;
  isError: boolean;
  durationMs: number;
  resultPreview: string;
};

export type AssistantAnswer = {
  answer: string;
  stopReason: 'answered' | 'max_model_calls';
  modelCalls: number;
  toolCalls: AssistantToolCallTrace[];
  usage: TokenUsage;
  provider: string;
  model: string | null;
  durationMs: number;
};

/**
 * Le « cerveau » du backend : une question, les outils du serveur MCP de
 * l'utilisateur, un modèle qui enchaîne les appels puis rédige. Même prompt
 * et mêmes outils que dans Claude.ai ; le fournisseur est celui de
 * `LLM_PROVIDER`.
 *
 * Un outil inconnu, des arguments invalides ou un refus de droits reviennent
 * au modèle comme un résultat en erreur, qu'il peut corriger.
 */
@Injectable()
export class AskAssistantService {
  private readonly logger = new Logger(AskAssistantService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly buildMcpServerService: BuildMcpServerService,
    private readonly permissionService: PermissionService,
    private readonly configService: ConfigurationService
  ) {}

  async ask(
    rawInput: AskAssistantInput,
    {
      user,
      signal,
      timeoutMs: timeoutOverride,
    }: { user: AuthenticatedUser; signal?: AbortSignal; timeoutMs?: number }
  ): Promise<Result<AssistantAnswer, AskAssistantError>> {
    const input = askAssistantInputSchema.parse(rawInput);
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }

    const maxModelCalls = Number(
      this.configService.get('ASSISTANT_MAX_MODEL_CALLS')
    );
    const timeoutMs =
      timeoutOverride ?? Number(this.configService.get('ASSISTANT_TIMEOUT_MS'));
    const tier = this.configService.get('ASSISTANT_TIER') as LlmTier;
    const provider = String(this.configService.get('LLM_PROVIDER'));
    const turnSignal = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
      : AbortSignal.timeout(timeoutMs);
    const startedAt = Date.now();

    const session = await McpSession.open(
      this.buildMcpServerService.build(user)
    );
    try {
      const systemInstruction =
        input.mode === 'esquisse'
          ? await session.getPromptText(MCP_ESQUISSE_PROMPT_NAME, {
              sujet: input.esquisse?.sujet ?? input.question,
              ...(input.esquisse?.appetit
                ? { appetit: input.esquisse.appetit }
                : {}),
              ...(input.esquisse?.contexte
                ? { contexte: input.esquisse.contexte }
                : {}),
            })
          : await session.getPromptText(
              input.mode === 'support'
                ? MCP_SUPPORT_PROMPT_NAME
                : MCP_ANALYSE_STATS_PROMPT_NAME
            );
      const tools = await session.listTools();
      const question =
        input.mode === 'support' && input.support
          ? `${await buildSupportContext(
              session,
              input.support
            )}\n\nQuestion du support : ${input.question}`
          : input.question;

      const messages: LlmChatMessage[] = [
        ...input.history.map(
          (entry): LlmChatMessage =>
            entry.role === 'user'
              ? { role: 'user', text: entry.text }
              : { role: 'assistant', text: entry.text, toolCalls: [] }
        ),
        { role: 'user', text: question },
      ];
      const usages: TokenUsage[] = [];
      const traces: AssistantToolCallTrace[] = [];
      const known = new Set(tools.map((tool) => tool.name));
      const alreadyCalled = new Set<string>();

      for (let modelCalls = 1; ; modelCalls += 1) {
        const lastCall = modelCalls >= maxModelCalls;
        if (lastCall) {
          messages.push({ role: 'user', text: LAST_TURN_INSTRUCTION });
        }
        const turn = await this.llmService.chat({
          tier,
          systemInstruction,
          messages,
          tools,
          toolChoice: lastCall ? 'none' : 'auto',
          signal: turnSignal,
        });
        if (turnSignal.aborted) {
          return failure('TIMEOUT');
        }
        if (!turn.success) {
          const cause = describeLlmError(turn.error);
          this.logger.warn(
            `Assistant model call ${modelCalls} failed: ${cause}`
          );
          return failure(
            turn.error.kind === 'unsupported'
              ? 'TOOLS_UNSUPPORTED'
              : 'LLM_ERROR',
            new Error(cause)
          );
        }
        usages.push(turn.data.usage);

        // Réponse finale, ou dernier appel : le texte écrit avant des appels
        // d'outils n'est jamais rendu, seule la réponse l'est.
        if (turn.data.toolCalls.length === 0 || lastCall) {
          this.logger.log(
            `Assistant answered after ${modelCalls} model calls and ${traces.length} tool calls`
          );
          return success({
            answer: turn.data.text?.trim() || fallbackAnswer(traces),
            stopReason: lastCall ? 'max_model_calls' : 'answered',
            modelCalls,
            toolCalls: traces,
            usage: sumTokenUsage(usages),
            provider,
            model: this.llmService.modelFor(tier) ?? null,
            durationMs: Date.now() - startedAt,
          });
        }

        messages.push({
          role: 'assistant',
          text: turn.data.text,
          toolCalls: turn.data.toolCalls,
          providerData: turn.data.providerData,
        });
        for (const [index, call] of turn.data.toolCalls.entries()) {
          const key = `${call.name} ${JSON.stringify(call.arguments)}`;
          const trace = await this.runToolCall(session, call, {
            known,
            withinBudget: index < MAX_TOOL_CALLS_PER_TURN,
            repeated: alreadyCalled.has(key),
          });
          alreadyCalled.add(key);
          traces.push(trace.trace);
          messages.push({
            role: 'tool',
            toolCallId: call.id,
            name: call.name,
            content: trace.content,
          });
        }
      }
    } finally {
      await session.close();
    }
  }

  private async runToolCall(
    session: McpSession,
    call: LlmToolCall,
    {
      known,
      withinBudget,
      repeated,
    }: { known: Set<string>; withinBudget: boolean; repeated: boolean }
  ): Promise<{ trace: AssistantToolCallTrace; content: string }> {
    const startedAt = Date.now();
    const result = !withinBudget
      ? {
          text: `Trop d'appels d'outils dans un même tour (${MAX_TOOL_CALLS_PER_TURN} au plus) : recommence avec moins d'appels.`,
          isError: true,
        }
      : call.argumentsError
      ? { text: call.argumentsError, isError: true }
      : repeated
      ? {
          text: `Appel identique déjà fait (${call.name}, mêmes arguments) : son résultat est plus haut. Change d'approche ou réponds.`,
          isError: true,
        }
      : !known.has(call.name)
      ? {
          text: `Outil inconnu : ${call.name}. Outils disponibles : ${[
            ...known,
          ].join(', ')}.`,
          isError: true,
        }
      : await session.callTool(call.name, call.arguments);
    const durationMs = Date.now() - startedAt;
    this.logger.log(
      `Assistant tool ${call.name} ${
        result.isError ? 'failed' : 'ok'
      } in ${durationMs} ms`
    );
    const content =
      result.text.length > MAX_TOOL_RESULT_CHARS
        ? `${result.text.slice(
            0,
            MAX_TOOL_RESULT_CHARS
          )}\n[Résultat tronqué : agrège ou filtre davantage.]`
        : result.text;
    return {
      content: result.isError ? `ERREUR : ${content}` : content,
      trace: {
        name: call.name,
        arguments: call.arguments,
        isError: result.isError,
        durationMs,
        resultPreview: result.text.slice(0, RESULT_PREVIEW_CHARS),
      },
    };
  }
}

export type { LlmToolDefinition };
