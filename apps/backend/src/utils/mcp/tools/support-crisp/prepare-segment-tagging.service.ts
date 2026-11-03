import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { CrispApiClient } from './crisp-api.client';
import {
  SEGMENT_TAGGING_TOKEN_TTL_MS,
  signSegmentTaggingAction,
} from './segment-tagging-token.rules';
import { SupportCrispError } from './support-crisp.errors';
import { supportConversationsFilterSchema } from './support-crisp.input';
import {
  SupportConversation,
  SupportConversationsService,
} from './support-conversations.service';
import { normalizeSegment, toExcerpt } from './support-segments.rules';

export const prepareSegmentTaggingInputSchema =
  supportConversationsFilterSchema.extend({
    segment: z
      .string()
      .trim()
      .min(2)
      .max(60)
      .describe(
        "Segment à ajouter, de préférence un segment existant (list_support_segments) : 'besoin_guidage_referentiel_cr'…"
      ),
  });
export type PrepareSegmentTaggingInput = z.input<
  typeof prepareSegmentTaggingInputSchema
>;

export const prepareSegmentTaggingOutputSchema = z.object({
  actionToken: z
    .string()
    .nullable()
    .describe(
      "Jeton de l'ajout, confirmé par l'utilisateur dans l'app ; null s'il n'y a aucune conversation à étiqueter"
    ),
  segment: z
    .string()
    .describe('Segment qui sera ajouté (orthographe existante si elle existe)'),
  segmentExistant: z.boolean(),
  segmentsProches: z
    .array(z.string())
    .describe('Segments existants qui ressemblent au segment demandé'),
  conversations: z.number().describe('Conversations qui recevront le segment'),
  dejaTaguees: z
    .number()
    .describe('Conversations du filtre qui ont déjà ce segment'),
  echantillon: z.array(
    z.object({
      date: z.string(),
      segments: z.array(z.string()),
      demande: z.string(),
    })
  ),
  expireA: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  remarque: z.string().nullable(),
});
export type PrepareSegmentTaggingOutput = z.infer<
  typeof prepareSegmentTaggingOutputSchema
>;

/** Au-delà, il faut resserrer le filtre : on n'étiquette pas à l'aveugle. */
export const MAX_TAGGED_CONVERSATIONS = 200;
const SAMPLE_SIZE = 5;
const MAX_CLOSE_SEGMENTS = 5;

export const SUPPORT_ROLE_REQUIRED_MESSAGE =
  "Écriture réservée aux comptes ayant le rôle support : le mode super admin n'y donne pas droit.";

/**
 * Prépare l'ajout d'un segment aux conversations d'un filtre, sans rien
 * écrire : l'utilisateur confirme dans l'app avec le jeton renvoyé.
 */
@Injectable()
export class PrepareSegmentTaggingService {
  private readonly logger = new Logger(PrepareSegmentTaggingService.name);

  constructor(
    private readonly supportConversationsService: SupportConversationsService,
    private readonly crispApiClient: CrispApiClient,
    private readonly permissionService: PermissionService,
    private readonly configService: ConfigurationService
  ) {}

  async run(
    rawInput: PrepareSegmentTaggingInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<PrepareSegmentTaggingOutput, SupportCrispError>> {
    const input = prepareSegmentTaggingInputSchema.parse(rawInput);
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.mutate',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED', new Error(SUPPORT_ROLE_REQUIRED_MESSAGE));
    }
    const wanted = normalizeSegment(input.segment);
    // Filtrer sur le segment à ajouter ne laisse que des conversations qui
    // l'ont déjà : contresens fréquent du modèle, on l'ignore et on le dit.
    const sujetIsTarget =
      Boolean(input.sujet) && normalizeSegment(input.sujet ?? '') === wanted;
    const filter = sujetIsTarget ? { ...input, sujet: null } : input;
    if (!filter.sujet && !filter.termes?.length) {
      return failure(
        'FILTER_REQUIRED',
        new Error(
          'Préciser sujet ou termes : on ne segmente pas toutes les conversations du support.'
        )
      );
    }

    const loaded = await this.supportConversationsService.select(filter, {
      user,
    });
    if (!loaded.success) {
      return loaded;
    }

    const spellings = countSpellings(loaded.data.all);
    const existing = spellings.get(wanted);
    const segment = existing?.raw ?? input.segment;
    const hasSegment = (conversation: SupportConversation) =>
      conversation.segments.some((parsed) => parsed.normalized === wanted);

    const toTag = loaded.data.selected.filter((c) => !hasSegment(c));
    if (toTag.length > MAX_TAGGED_CONVERSATIONS) {
      return failure(
        'TOO_MANY_CONVERSATIONS',
        new Error(
          `${toTag.length} conversations : ${MAX_TAGGED_CONVERSATIONS} au plus, resserrer la période ou les termes.`
        )
      );
    }

    const echantillon: PrepareSegmentTaggingOutput['echantillon'] = [];
    for (const conversation of toTag.slice(-SAMPLE_SIZE)) {
      const messages = await this.crispApiClient.listMessages(conversation);
      const demande = messages.success
        ? messages.data
            .filter(
              (message) =>
                message.from === 'user' && typeof message.content === 'string'
            )
            .map((message) => message.content as string)
            .slice(0, 2)
            .join(' / ')
        : '';
      echantillon.push({
        date: new Date(conversation.created_at).toISOString().slice(0, 10),
        segments: conversation.segments
          .filter((parsed) => parsed.kind !== 'parcours')
          .map((parsed) => parsed.normalized),
        demande: toExcerpt(demande, 250),
      });
    }

    const expiresAt = Date.now() + SEGMENT_TAGGING_TOKEN_TTL_MS;
    const actionToken = toTag.length
      ? signSegmentTaggingAction(
          {
            userId: user.id,
            segment,
            sessionIds: toTag.map((conversation) => conversation.session_id),
            expiresAt,
          },
          this.configService.get('SUPABASE_JWT_SECRET')
        )
      : null;
    this.logger.log(
      `Segment tagging prepared by ${user.id}: « ${segment} » on ${toTag.length} conversations`
    );

    return success({
      actionToken,
      segment,
      segmentExistant: Boolean(existing),
      segmentsProches: existing ? [] : closeSegments(wanted, spellings),
      conversations: toTag.length,
      dejaTaguees: loaded.data.selected.length - toTag.length,
      echantillon,
      expireA: new Date(expiresAt).toISOString(),
      dateFrom: loaded.data.dateFrom,
      dateTo: loaded.data.dateTo,
      remarque: sujetIsTarget
        ? 'Le filtre sujet était le segment à ajouter : il a été ignoré, seuls les termes et la période filtrent.'
        : null,
    });
  }
}

/** Orthographe la plus fréquente de chaque segment normalisé. */
const countSpellings = (
  conversations: SupportConversation[]
): Map<string, { raw: string; count: number }> => {
  const counts = new Map<string, Map<string, number>>();
  for (const conversation of conversations) {
    for (const raw of conversation.meta?.segments ?? []) {
      const normalized = normalizeSegment(raw);
      const variants = counts.get(normalized) ?? new Map<string, number>();
      variants.set(raw, (variants.get(raw) ?? 0) + 1);
      counts.set(normalized, variants);
    }
  }
  return new Map(
    [...counts.entries()].map(([normalized, variants]) => {
      const [raw] = [...variants.entries()].sort((a, b) => b[1] - a[1])[0];
      const count = [...variants.values()].reduce((sum, n) => sum + n, 0);
      return [normalized, { raw, count }];
    })
  );
};

const closeSegments = (
  wanted: string,
  spellings: Map<string, { raw: string; count: number }>
): string[] => {
  const words = new Set(wanted.split('_').filter((word) => word.length > 1));
  return [...spellings.entries()]
    .map(([normalized, { raw, count }]) => ({
      raw,
      count,
      shared: normalized.split('_').filter((word) => words.has(word)).length,
    }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.count - a.count)
    .slice(0, MAX_CLOSE_SEGMENTS)
    .map(({ raw }) => raw);
};
