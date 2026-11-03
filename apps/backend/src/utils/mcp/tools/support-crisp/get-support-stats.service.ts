import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result, success } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import { CrispApiClient } from './crisp-api.client';
import { SupportCrispError } from './support-crisp.errors';
import { supportConversationsFilterSchema } from './support-crisp.input';
import {
  MAX_TEXT_SEARCH_CONVERSATIONS,
  SupportConversation,
  SupportConversationsService,
} from './support-conversations.service';
import {
  estimateHumanMinutes,
  median,
  METHODE_TEMPS_ESTIME,
  PARCOURS_SEGMENTS,
  ParsedSegment,
  segmentMatchesSujet,
  spreadSample,
  TAXONOMIE_SEGMENTS_DEPUIS,
} from './support-segments.rules';

export const getSupportStatsInputSchema =
  supportConversationsFilterSchema.extend({
    decoupage: z
      .enum(['mois', 'semaine'])
      .nullish()
      .describe('Découpage du volume dans le temps (mois par défaut)'),
  });
export type GetSupportStatsInput = z.input<typeof getSupportStatsInputSchema>;

const countSchema = z.object({ conversations: z.number() });

export const getSupportStatsOutputSchema = z.object({
  resume: z
    .string()
    .describe('Les chiffres clés en une phrase, à reprendre tels quels'),
  dateFrom: z.string(),
  dateTo: z.string(),
  sujet: z.string().nullable(),
  conversations: z
    .number()
    .describe(
      'Conversations du sujet créées sur la période : LE volume demandé'
    ),
  totalSupportTousSujets: z
    .number()
    .describe(
      'Toutes les conversations du support sur la période, tous sujets confondus : seulement un dénominateur'
    ),
  partDuSupportPourcent: z.number(),
  parPeriode: z.array(countSchema.extend({ periode: z.string() })),
  parType: z
    .array(countSchema.extend({ type: z.string() }))
    .describe(
      "Type de retour lu dans le segment ; une conversation peut en avoir plusieurs. 'non_classe' : aucun segment de classement ; 'ancienne_taxonomie' : segment antérieur au 13/05/2026."
    ),
  segments: z.array(countSchema.extend({ segment: z.string() })),
  parcours: z.object({
    assistantAccepte: z.number(),
    supportDemande: z.number(),
    repriseHumaine: z.number(),
    workflowTermine: z.number(),
  }),
  tempsSupportEstime: z
    .object({
      conversationsAnalysees: z.number(),
      extrapole: z.boolean(),
      sansInterventionHumaine: z.number(),
      totalHeures: z.number(),
      medianeMinutes: z.number(),
      moyenneMinutes: z.number(),
      methode: z.string(),
    })
    .nullable(),
  premiereConversation: z.string().nullable(),
  derniereConversation: z.string().nullable(),
  avertissements: z.array(z.string()),
});
export type GetSupportStatsOutput = z.infer<typeof getSupportStatsOutputSchema>;

/** Conversations dont on lit les messages pour estimer le temps passé. */
export const MAX_TIMED_CONVERSATIONS = 150;
const MESSAGE_CONCURRENCY = 6;
const MAX_SEGMENTS = 25;
const LATE_FIRST_CONVERSATION_DAYS = 14;

/**
 * Volume, types de retours et temps passé par le support sur un sujet, d'après
 * les segments Crisp. Les chiffres sont calculés ici ; le modèle ne fait que
 * les présenter.
 */
@Injectable()
export class GetSupportStatsService {
  constructor(
    private readonly supportConversationsService: SupportConversationsService,
    private readonly crispApiClient: CrispApiClient
  ) {}

  async run(
    rawInput: GetSupportStatsInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<GetSupportStatsOutput, SupportCrispError>> {
    const input = getSupportStatsInputSchema.parse(rawInput);
    const loaded = await this.supportConversationsService.select(input, {
      user,
    });
    if (!loaded.success) {
      return loaded;
    }
    const {
      selected,
      total,
      dateFrom,
      dateTo,
      truncated,
      textSearchTruncated,
    } = loaded.data;
    const sujet = input.sujet ?? null;
    const relevant = (segment: ParsedSegment) =>
      segment.kind !== 'parcours' &&
      (!sujet || segmentMatchesSujet(segment, sujet));

    const avertissements: string[] = [];
    if (truncated) {
      avertissements.push(
        'Crisp a renvoyé trop de conversations : la période a été lue partiellement, les chiffres sont des minimums.'
      );
    }
    if (textSearchTruncated) {
      avertissements.push(
        `Recherche par termes limitée aux ${MAX_TEXT_SEARCH_CONVERSATIONS} conversations les plus récentes : raccourcir la période.`
      );
    }
    if (dateFrom < TAXONOMIE_SEGMENTS_DEPUIS) {
      avertissements.push(
        `Avant le ${TAXONOMIE_SEGMENTS_DEPUIS}, les segments suivaient une autre taxonomie (connexion-acces, edl-cae…) : comparer les périodes avec prudence.`
      );
    }
    const first = selected[0];
    if (
      sujet &&
      first &&
      first.created_at - Date.parse(dateFrom) >
        LATE_FIRST_CONVERSATION_DAYS * 24 * 60 * 60 * 1000
    ) {
      avertissements.push(
        `Aucune conversation de ce sujet avant le ${toDay(
          first.created_at
        )} : le segment n'était sans doute pas encore utilisé, les demandes antérieures sont classées sous un segment plus large.`
      );
    }

    const temps = await this.estimateTime(selected);
    if (temps?.extrapole) {
      avertissements.push(
        `Temps estimé sur un échantillon de ${temps.conversationsAnalysees} conversations puis extrapolé.`
      );
    }

    const partDuSupportPourcent = total
      ? Math.round((selected.length / total) * 1000) / 10
      : 0;
    return success({
      resume: buildResume({
        sujet,
        conversations: selected.length,
        total,
        partDuSupportPourcent,
        dateFrom,
        dateTo,
        temps,
      }),
      dateFrom,
      dateTo,
      sujet,
      conversations: selected.length,
      totalSupportTousSujets: total,
      partDuSupportPourcent,
      parPeriode: countBy(selected, (conversation) => [
        input.decoupage === 'semaine'
          ? toWeek(conversation.created_at)
          : toDay(conversation.created_at).slice(0, 7),
      ])
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(({ key, conversations }) => ({ periode: key, conversations })),
      parType: countBy(selected, (conversation) => {
        const segments = conversation.segments.filter(relevant);
        const types = segments.flatMap((segment) =>
          segment.kind === 'classement' ? [segment.type] : []
        );
        if (types.length) {
          return types;
        }
        return segments.length ? ['ancienne_taxonomie'] : ['non_classe'];
      }).map(({ key, conversations }) => ({ type: key, conversations })),
      segments: countBy(selected, (conversation) =>
        conversation.segments
          .filter(relevant)
          .map((segment) => segment.normalized)
      )
        .slice(0, MAX_SEGMENTS)
        .map(({ key, conversations }) => ({ segment: key, conversations })),
      parcours: Object.fromEntries(
        Object.entries(PARCOURS_SEGMENTS).map(([segment, field]) => [
          field,
          selected.filter((conversation) =>
            conversation.segments.some(
              (parsed) =>
                parsed.kind === 'parcours' && parsed.normalized === segment
            )
          ).length,
        ])
      ) as GetSupportStatsOutput['parcours'],
      tempsSupportEstime: temps,
      premiereConversation: first ? toDay(first.created_at) : null,
      derniereConversation: selected.length
        ? toDay(selected[selected.length - 1].created_at)
        : null,
      avertissements,
    });
  }

  private async estimateTime(
    conversations: SupportConversation[]
  ): Promise<GetSupportStatsOutput['tempsSupportEstime']> {
    if (conversations.length === 0) {
      return null;
    }
    const sample = spreadSample(conversations, MAX_TIMED_CONVERSATIONS);
    const minutes: number[] = [];
    let index = 0;
    const worker = async () => {
      while (index < sample.length) {
        const conversation = sample[index++];
        const messages = await this.crispApiClient.listMessages(conversation);
        if (messages.success) {
          minutes.push(estimateHumanMinutes(messages.data));
        }
      }
    };
    await Promise.all(
      Array.from({ length: MESSAGE_CONCURRENCY }, () => worker())
    );
    if (minutes.length === 0) {
      return null;
    }

    const sum = minutes.reduce((total, value) => total + value, 0);
    const extrapole = minutes.length < conversations.length;
    const total = extrapole
      ? (sum / minutes.length) * conversations.length
      : sum;
    return {
      conversationsAnalysees: minutes.length,
      extrapole,
      sansInterventionHumaine: minutes.filter((value) => value === 0).length,
      totalHeures: Math.round(total / 6) / 10,
      medianeMinutes: Math.round(median(minutes)),
      moyenneMinutes: Math.round(sum / minutes.length),
      methode: METHODE_TEMPS_ESTIME,
    };
  }
}

const buildResume = ({
  sujet,
  conversations,
  total,
  partDuSupportPourcent,
  dateFrom,
  dateTo,
  temps,
}: {
  sujet: string | null;
  conversations: number;
  total: number;
  partDuSupportPourcent: number;
  dateFrom: string;
  dateTo: string;
  temps: GetSupportStatsOutput['tempsSupportEstime'];
}): string => {
  const periode = `du ${dateFrom} au ${dateTo}`;
  const volume = sujet
    ? `${conversations} conversation(s) sur le sujet « ${sujet} » ${periode}, soit ${toFrench(
        partDuSupportPourcent
      )} % des ${total} conversations du support sur la période.`
    : `${conversations} conversation(s) au support ${periode}.`;
  const duree = temps
    ? ` Temps passé par le support estimé à ${toFrench(
        temps.totalHeures
      )} h (médiane ${temps.medianeMinutes} min par conversation).`
    : '';
  return volume + duree;
};

const toFrench = (value: number): string => value.toLocaleString('fr-FR');

const countBy = <T>(
  items: T[],
  keysOf: (item: T) => string[]
): { key: string; conversations: number }[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const key of new Set(keysOf(item))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([key, conversations]) => ({ key, conversations }))
    .sort((a, b) => b.conversations - a.conversations);
};

const toDay = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);

/** Lundi de la semaine, AAAA-MM-JJ. */
const toWeek = (timestamp: number): string => {
  const date = new Date(toDay(timestamp));
  const dayFromMonday = (date.getUTCDay() + 6) % 7;
  return toDay(date.getTime() - dayFromMonday * 24 * 60 * 60 * 1000);
};
