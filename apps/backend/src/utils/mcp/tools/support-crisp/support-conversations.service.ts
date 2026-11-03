import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { CrispConversation, CrispApiClient } from './crisp-api.client';
import { SupportCrispError } from './support-crisp.errors';
import { SupportConversationsFilter } from './support-crisp.input';
import {
  buildTermesMatcher,
  ParsedSegment,
  parseSegment,
  segmentMatchesSujet,
} from './support-segments.rules';

export const DEFAULT_PERIOD_DAYS = 90;
export const MAX_PERIOD_DAYS = 366;
/** Conversations lues au plus pour une recherche par termes. */
export const MAX_TEXT_SEARCH_CONVERSATIONS = 600;
// Au-delà, Crisp répond 429 sur une longue période.
const MESSAGE_CONCURRENCY = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SupportConversation = CrispConversation & {
  segments: ParsedSegment[];
};

export type SelectedSupportConversations = {
  dateFrom: string;
  dateTo: string;
  /** Conversations créées sur la période, tous sujets confondus. */
  all: SupportConversation[];
  total: number;
  /** Celles du filtre, de la plus ancienne à la plus récente. */
  selected: SupportConversation[];
  truncated: boolean;
  /** Recherche par termes limitée aux conversations les plus récentes. */
  textSearchTruncated: boolean;
};

/**
 * Conversations Crisp d'une période, filtrées sur un sujet de segment et sur
 * des termes cherchés dans les messages. Réservé aux comptes support
 * (`utils.mcp.read`).
 */
@Injectable()
export class SupportConversationsService {
  private readonly logger = new Logger(SupportConversationsService.name);

  constructor(
    private readonly crispApiClient: CrispApiClient,
    private readonly permissionService: PermissionService
  ) {}

  async select(
    filter: SupportConversationsFilter,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<SelectedSupportConversations, SupportCrispError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED');
    }
    if (!this.crispApiClient.isConfigured()) {
      return failure('CRISP_NOT_CONFIGURED');
    }

    const period = resolvePeriod(filter, new Date());
    if (!period.ok) {
      return failure('INVALID_DATE_RANGE', new Error(period.reason));
    }

    const listed = await this.crispApiClient.listConversationsActiveSince(
      period.from
    );
    if (!listed.success) {
      return listed;
    }

    const inPeriod = listed.data.conversations
      .filter(
        (conversation) =>
          conversation.created_at >= period.from.getTime() &&
          conversation.created_at < period.toExclusive.getTime()
      )
      .sort((a, b) => a.created_at - b.created_at)
      .map(
        (conversation): SupportConversation => ({
          ...conversation,
          segments: (conversation.meta?.segments ?? []).map(parseSegment),
        })
      );
    const { sujet } = filter;
    const termes =
      typeof filter.termes === 'string' ? [filter.termes] : filter.termes;
    const bySujet = sujet
      ? inPeriod.filter((conversation) =>
          conversation.segments.some((segment) =>
            segmentMatchesSujet(segment, sujet)
          )
        )
      : inPeriod;
    const byTermes = termes?.length
      ? await this.filterByTermes(bySujet, termes)
      : success({ conversations: bySujet, truncated: false });
    if (!byTermes.success) {
      return byTermes;
    }
    const selected = byTermes.data.conversations;

    this.logger.log(
      `Crisp support conversations ${period.dateFrom} → ${
        period.dateTo
      }, sujet ${sujet ?? '(tous)'}, termes ${
        termes?.join('|') ?? '(aucun)'
      }: ${selected.length}/${inPeriod.length}`
    );
    return success({
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      all: inPeriod,
      total: inPeriod.length,
      selected,
      truncated: listed.data.truncated,
      textSearchTruncated: byTermes.data.truncated,
    });
  }

  /** Lit les messages (en cache) et garde les conversations qui citent un terme. */
  private async filterByTermes(
    conversations: SupportConversation[],
    termes: string[]
  ): Promise<
    Result<
      { conversations: SupportConversation[]; truncated: boolean },
      SupportCrispError
    >
  > {
    const matches = buildTermesMatcher(termes);
    const scanned = conversations.slice(-MAX_TEXT_SEARCH_CONVERSATIONS);
    const kept = new Set<string>();
    let failed: Result<never, SupportCrispError> | null = null;
    let index = 0;
    const worker = async () => {
      while (index < scanned.length && !failed) {
        const conversation = scanned[index++];
        const messages = await this.crispApiClient.listMessages(conversation);
        if (!messages.success) {
          failed = messages;
          return;
        }
        if (
          messages.data.some(
            (message) =>
              typeof message.content === 'string' && matches(message.content)
          )
        ) {
          kept.add(conversation.session_id);
        }
      }
    };
    await Promise.all(
      Array.from({ length: MESSAGE_CONCURRENCY }, () => worker())
    );
    if (failed) {
      return failed;
    }
    return success({
      conversations: scanned.filter((c) => kept.has(c.session_id)),
      truncated: scanned.length < conversations.length,
    });
  }
}

type ResolvedPeriod =
  | {
      ok: true;
      from: Date;
      toExclusive: Date;
      dateFrom: string;
      dateTo: string;
    }
  | { ok: false; reason: string };

export const resolvePeriod = (
  { dateFrom, dateTo }: Pick<SupportConversationsFilter, 'dateFrom' | 'dateTo'>,
  now: Date
): ResolvedPeriod => {
  const today = new Date(now.toISOString().slice(0, 10));
  const to = dateTo ? new Date(dateTo) : today;
  const from = dateFrom
    ? new Date(dateFrom)
    : new Date(to.getTime() - DEFAULT_PERIOD_DAYS * DAY_MS);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { ok: false, reason: 'Date invalide.' };
  }
  if (from > to) {
    return { ok: false, reason: 'dateFrom est postérieure à dateTo.' };
  }
  if ((to.getTime() - from.getTime()) / DAY_MS > MAX_PERIOD_DAYS) {
    return {
      ok: false,
      reason: `Période de ${MAX_PERIOD_DAYS} jours au plus : la découper.`,
    };
  }
  return {
    ok: true,
    from,
    toExclusive: new Date(to.getTime() + DAY_MS),
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
};
