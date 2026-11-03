import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';

export type CrispConversation = {
  session_id: string;
  created_at: number;
  updated_at: number;
  state?: string;
  meta?: { segments?: string[] };
};

export type CrispMessage = {
  from: 'user' | 'operator';
  type: string;
  origin?: string;
  content?: unknown;
  timestamp: number;
  user?: { type?: string; user_id?: string };
};

export type CrispApiError = 'CRISP_NOT_CONFIGURED' | 'CRISP_API_ERROR';

const API_URL = 'https://api.crisp.chat/v1';
const REQUEST_TIMEOUT_MS = 30_000;
/** Maximum accepté par Crisp (100 renvoie `overflow_page_size`). */
const CONVERSATIONS_PER_PAGE = 50;
/** 12 mois de conversations tiennent dans ~60 pages (3 000 conversations). */
const MAX_CONVERSATION_PAGES = 100;
/** Taille d'une page de messages chez Crisp. */
const MESSAGES_PER_PAGE = 40;
const MAX_MESSAGE_PAGES = 5;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_RATE_LIMIT_RETRIES = 5;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** `Retry-After` en secondes s'il est donné, sinon 1, 2, 4, 8, 16 s. */
export const retryDelayMs = (
  retryAfter: string | null,
  attempt: number
): number => {
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds, 30) * 1000
    : 1000 * 2 ** attempt;
};
const MAX_CACHED_SESSIONS = 5_000;

/**
 * API REST Crisp avec un jeton de niveau `website` : liste des conversations,
 * messages, et segments d'une conversation (seule écriture). Les relectures
 * sont mises en cache une heure : une question de suivi ne rescanne pas Crisp.
 */
@Injectable()
export class CrispApiClient {
  private readonly logger = new Logger(CrispApiClient.name);

  private readonly conversationsCache = new Map<
    string,
    { loadedAt: number; conversations: CrispConversation[]; truncated: boolean }
  >();
  private readonly messagesCache = new Map<
    string,
    { updatedAt: number; messages: CrispMessage[] }
  >();

  constructor(private readonly configService: ConfigurationService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get('CRISP_API_IDENTIFIER') &&
        this.configService.get('CRISP_API_KEY')
    );
  }

  /**
   * Conversations actives depuis `since`. Crisp filtre sur la date de
   * dernière activité : celles créées depuis `since` sont toutes dedans, à
   * l'appelant de filtrer sur `created_at`.
   */
  async listConversationsActiveSince(
    since: Date
  ): Promise<
    Result<
      { conversations: CrispConversation[]; truncated: boolean },
      CrispApiError
    >
  > {
    const key = since.toISOString();
    const cached = this.conversationsCache.get(key);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      return success(cached);
    }

    const conversations: CrispConversation[] = [];
    let truncated = true;
    for (let page = 1; page <= MAX_CONVERSATION_PAGES; page++) {
      const result = await this.get<CrispConversation[]>(
        `conversations/${page}`,
        {
          per_page: String(CONVERSATIONS_PER_PAGE),
          filter_date_start: since.toISOString(),
          filter_date_end: new Date().toISOString(),
        }
      );
      if (!result.success) {
        return result;
      }
      conversations.push(...result.data);
      if (result.data.length < CONVERSATIONS_PER_PAGE) {
        truncated = false;
        break;
      }
    }
    if (truncated) {
      this.logger.warn(
        `Crisp conversations since ${key}: stopped after ${MAX_CONVERSATION_PAGES} pages`
      );
    }

    // Une conversation active pendant le scan peut changer de page.
    const unique = [
      ...new Map(conversations.map((c) => [c.session_id, c])).values(),
    ];
    const entry = { loadedAt: Date.now(), conversations: unique, truncated };
    this.conversationsCache.set(key, entry);
    return success(entry);
  }

  /** Messages d'une conversation, du plus ancien au plus récent. */
  async listMessages(
    conversation: Pick<CrispConversation, 'session_id' | 'updated_at'>
  ): Promise<Result<CrispMessage[], CrispApiError>> {
    const cached = this.messagesCache.get(conversation.session_id);
    if (cached && cached.updatedAt === conversation.updated_at) {
      return success(cached.messages);
    }

    const messages: CrispMessage[] = [];
    let before: number | undefined;
    for (let page = 1; page <= MAX_MESSAGE_PAGES; page++) {
      const result = await this.get<CrispMessage[]>(
        `conversation/${conversation.session_id}/messages`,
        before ? { timestamp_before: String(before) } : {}
      );
      if (!result.success) {
        return result;
      }
      messages.unshift(...result.data);
      if (result.data.length < MESSAGES_PER_PAGE) {
        break;
      }
      before = Math.min(...result.data.map((message) => message.timestamp));
    }

    if (this.messagesCache.size >= MAX_CACHED_SESSIONS) {
      this.messagesCache.clear();
    }
    this.messagesCache.set(conversation.session_id, {
      updatedAt: conversation.updated_at,
      messages,
    });
    return success(messages);
  }

  /**
   * Conversations d'un contact Crisp (identifiant ou e-mail), des plus
   * récentes aux plus anciennes. Un contact inconnu donne une liste vide.
   */
  async listPeopleSessionIds(
    peopleIdOrEmail: string,
    maxPages = 2
  ): Promise<Result<string[], CrispApiError>> {
    const ids: string[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const result = await this.get<string[]>(
        `people/conversations/${encodeURIComponent(
          peopleIdOrEmail
        )}/list/${page}`,
        {}
      );
      if (!result.success) {
        return /not_found/.test(result.cause?.message ?? '')
          ? success(ids)
          : result;
      }
      ids.push(...result.data);
      if (result.data.length === 0) {
        break;
      }
    }
    return success([...new Set(ids)]);
  }

  async getConversation(
    sessionId: string
  ): Promise<Result<CrispConversation, CrispApiError>> {
    return this.request<CrispConversation>('GET', `conversation/${sessionId}`);
  }

  /** Segments actuels d'une conversation, relus juste avant d'écrire. */
  async getSegments(
    sessionId: string
  ): Promise<Result<string[], CrispApiError>> {
    const result = await this.request<{ segments?: string[] }>(
      'GET',
      `conversation/${sessionId}/meta`
    );
    return result.success ? success(result.data.segments ?? []) : result;
  }

  /**
   * Remplace les segments d'une conversation : l'appelant envoie la liste
   * complète (anciens + nouveaux), la documentation de Crisp ne garantissant
   * pas la fusion.
   */
  async updateSegments(
    sessionId: string,
    segments: string[]
  ): Promise<Result<void, CrispApiError>> {
    const result = await this.request<unknown>(
      'PATCH',
      `conversation/${sessionId}/meta`,
      {},
      { segments }
    );
    if (!result.success) {
      return result;
    }
    // Les listes en cache portent les anciens segments.
    this.conversationsCache.clear();
    return success(undefined);
  }

  private get<Data>(
    path: string,
    params: Record<string, string>
  ): Promise<Result<Data, CrispApiError>> {
    return this.request<Data>('GET', path, params);
  }

  private async request<Data>(
    method: 'GET' | 'PATCH',
    path: string,
    params: Record<string, string> = {},
    payload?: unknown
  ): Promise<Result<Data, CrispApiError>> {
    const identifier = this.configService.get('CRISP_API_IDENTIFIER');
    const key = this.configService.get('CRISP_API_KEY');
    if (!identifier || !key) {
      return failure('CRISP_NOT_CONFIGURED');
    }
    const websiteId = this.configService.get('CRISP_WEBSITE_ID');
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/website/${websiteId}/${path}${
      query ? `?${query}` : ''
    }`;

    let body: { error?: boolean; reason?: string; data?: unknown } = {};
    let status = 0;
    try {
      for (let attempt = 0; ; attempt++) {
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${identifier}:${key}`
            ).toString('base64')}`,
            'X-Crisp-Tier': 'website',
            ...(payload === undefined
              ? {}
              : { 'Content-Type': 'application/json' }),
          },
          body: payload === undefined ? undefined : JSON.stringify(payload),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        status = response.status;
        // Limite de débit en rafale : Crisp se libère en quelques secondes.
        if (status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
          await sleep(
            retryDelayMs(response.headers.get('retry-after'), attempt)
          );
          continue;
        }
        body = await response.json();
        break;
      }
    } catch (error) {
      this.logger.warn(
        `Crisp ${method} ${path} failed: ${(error as Error).message}`
      );
      return failure('CRISP_API_ERROR', error as Error);
    }

    if (body?.error || (method === 'GET' && body?.data === undefined)) {
      return failure(
        'CRISP_API_ERROR',
        new Error(
          `Crisp HTTP ${status} : ${body?.reason ?? 'réponse illisible'}`
        )
      );
    }
    return success(body.data as Data);
  }
}
