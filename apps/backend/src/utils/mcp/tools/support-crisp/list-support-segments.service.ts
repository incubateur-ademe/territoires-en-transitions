import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { SupportCrispError } from './support-crisp.errors';
import { supportConversationsFilterSchema } from './support-crisp.input';
import { SupportConversationsService } from './support-conversations.service';
import { normalizeSegment, parseSegment } from './support-segments.rules';

export const listSupportSegmentsInputSchema =
  supportConversationsFilterSchema.pick({ dateFrom: true, dateTo: true });
export type ListSupportSegmentsInput = z.infer<
  typeof listSupportSegmentsInputSchema
>;

const segmentCountSchema = z.object({
  segment: z.string().describe('Orthographe la plus utilisée'),
  conversations: z.number(),
  variantes: z
    .array(z.string())
    .describe('Autres orthographes du même segment (accents, casse)'),
});

export const listSupportSegmentsOutputSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  conversations: z.number(),
  sansSegment: z.number(),
  parType: z.array(
    z.object({
      type: z.string(),
      segments: z.array(segmentCountSchema),
    })
  ),
  parcours: z.array(segmentCountSchema),
  ancienneTaxonomie: z.array(segmentCountSchema),
});
export type ListSupportSegmentsOutput = z.infer<
  typeof listSupportSegmentsOutputSchema
>;

const MAX_PER_GROUP = 30;

/** Les segments Crisp utilisés sur une période, rangés par type de retour. */
@Injectable()
export class ListSupportSegmentsService {
  constructor(
    private readonly supportConversationsService: SupportConversationsService
  ) {}

  async run(
    input: ListSupportSegmentsInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ListSupportSegmentsOutput, SupportCrispError>> {
    const loaded = await this.supportConversationsService.select(input, {
      user,
    });
    if (!loaded.success) {
      return loaded;
    }

    const groups = new Map<
      string,
      Map<string, { variants: Map<string, number>; conversations: number }>
    >();
    for (const conversation of loaded.data.all) {
      const seen = new Set<string>();
      for (const raw of conversation.meta?.segments ?? []) {
        const parsed = parseSegment(raw);
        const normalized = normalizeSegment(raw);
        const group =
          parsed.kind === 'classement'
            ? parsed.type
            : parsed.kind === 'parcours'
            ? '_parcours'
            : '_ancien';
        const segments = groups.get(group) ?? new Map();
        const entry = segments.get(normalized) ?? {
          variants: new Map<string, number>(),
          conversations: 0,
        };
        entry.variants.set(raw, (entry.variants.get(raw) ?? 0) + 1);
        if (!seen.has(normalized)) {
          entry.conversations += 1;
          seen.add(normalized);
        }
        segments.set(normalized, entry);
        groups.set(group, segments);
      }
    }

    const toList = (group: string) =>
      [...(groups.get(group)?.values() ?? [])]
        .map(({ variants, conversations }) => {
          const [segment, ...variantes] = [...variants.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([raw]) => raw);
          return { segment, conversations, variantes };
        })
        .sort((a, b) => b.conversations - a.conversations)
        .slice(0, MAX_PER_GROUP);

    return success({
      dateFrom: loaded.data.dateFrom,
      dateTo: loaded.data.dateTo,
      conversations: loaded.data.total,
      sansSegment: loaded.data.all.filter(
        (conversation) => !conversation.meta?.segments?.length
      ).length,
      parType: [...groups.keys()]
        .filter((group) => !group.startsWith('_'))
        .map((type) => ({ type, segments: toList(type) }))
        .sort(
          (a, b) =>
            b.segments.reduce((sum, s) => sum + s.conversations, 0) -
            a.segments.reduce((sum, s) => sum + s.conversations, 0)
        ),
      parcours: toList('_parcours'),
      ancienneTaxonomie: toList('_ancien'),
    });
  }
}
