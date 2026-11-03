import type { CrispMessage } from './crisp-api.client';

/**
 * Taxonomie des segments Crisp du support, en place depuis le 13/05/2026 :
 * `<type>_<sujet>[_<précision>]` (ex. `besoin_guidage_referentiel_cr`). Les
 * segments sont saisis à la main : accents et variantes existent
 * (`besoin_guidage_référentiel_cr`), d'où la normalisation.
 */
export const SUPPORT_SEGMENT_TYPES = [
  'besoin_guidage',
  'support_obligatoire',
  'amelioration',
  'metier',
  'bug',
  'autre',
] as const;
export type SupportSegmentType = (typeof SUPPORT_SEGMENT_TYPES)[number];

/** Variantes de saisie rattachées à un type. */
const TYPE_ALIASES: Record<string, SupportSegmentType> = {
  guidage: 'besoin_guidage',
};

/** Segments posés par le parcours (bot, reprise), pas par le classement. */
export const PARCOURS_SEGMENTS = {
  assistant_accepte: 'assistantAccepte',
  support_demande: 'supportDemande',
  reprise_humaine: 'repriseHumaine',
  workflow_termine: 'workflowTermine',
} as const;
type ParcoursKey = keyof typeof PARCOURS_SEGMENTS;

/** Avant cette date, les segments suivent une autre taxonomie. */
export const TAXONOMIE_SEGMENTS_DEPUIS = '2026-05-13';

export type ParsedSegment =
  | { kind: 'parcours'; normalized: ParcoursKey }
  | {
      kind: 'classement';
      normalized: string;
      type: SupportSegmentType;
      sujet: string | null;
    }
  | { kind: 'ancien'; normalized: string };

export const normalizeSegment = (segment: string): string =>
  segment
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');

export const parseSegment = (segment: string): ParsedSegment => {
  const normalized = normalizeSegment(segment);
  if (normalized in PARCOURS_SEGMENTS) {
    return { kind: 'parcours', normalized: normalized as ParcoursKey };
  }
  const prefixes = [
    ...SUPPORT_SEGMENT_TYPES.map((type) => [type, type] as const),
    ...Object.entries(TYPE_ALIASES),
  ];
  for (const [prefix, type] of prefixes) {
    if (normalized === prefix) {
      return { kind: 'classement', normalized, type, sujet: null };
    }
    if (normalized.startsWith(`${prefix}_`)) {
      return {
        kind: 'classement',
        normalized,
        type,
        sujet: normalized.slice(prefix.length + 1),
      };
    }
  }
  return { kind: 'ancien', normalized };
};

/**
 * Le sujet demandé (`cr`, `referentiel`, `bug_indicateur`…) correspond à un
 * segment si ses mots y figurent à la suite, type compris : `referentiel`
 * couvre `besoin_guidage_referentiel_cr`, `bug` tous les `bug_*`.
 */
export const segmentMatchesSujet = (
  segment: ParsedSegment,
  sujet: string
): boolean => {
  if (segment.kind === 'parcours') {
    return false;
  }
  const wanted = normalizeSegment(sujet).split('_').filter(Boolean);
  const words = segment.normalized.split('_').filter(Boolean);
  if (wanted.length === 0) {
    return false;
  }
  for (let start = 0; start + wanted.length <= words.length; start++) {
    if (wanted.every((word, index) => words[start + index] === word)) {
      return true;
    }
  }
  return false;
};

/** Écart au-delà duquel deux messages du support sont deux interventions. */
export const INTERVENTION_GAP_MS = 20 * 60 * 1000;
/** Lecture et rédaction d'une intervention, en plus de sa durée apparente. */
export const MINUTES_PAR_INTERVENTION = 3;

export const METHODE_TEMPS_ESTIME = `Estimation, pas une mesure : Crisp n'enregistre aucune durée de traitement. Les messages et notes écrits par un opérateur humain (bots et plugins exclus) sont regroupés en interventions quand moins de ${
  INTERVENTION_GAP_MS / 60_000
} minutes les séparent ; chaque intervention compte sa durée plus ${MINUTES_PAR_INTERVENTION} minutes.`;

const HUMAN_MESSAGE_TYPES = new Set(['text', 'note', 'file', 'audio']);

export const isHumanOperatorMessage = (message: CrispMessage): boolean =>
  message.from === 'operator' &&
  HUMAN_MESSAGE_TYPES.has(message.type) &&
  !String(message.origin ?? '').startsWith('urn:') &&
  message.user?.type !== 'website' &&
  Boolean(message.user?.user_id);

/** Minutes estimées passées par le support sur une conversation. */
export const estimateHumanMinutes = (messages: CrispMessage[]): number => {
  const timestamps = messages
    .filter(isHumanOperatorMessage)
    .map((message) => message.timestamp)
    .sort((a, b) => a - b);
  if (timestamps.length === 0) {
    return 0;
  }
  let minutes = 0;
  let start = timestamps[0];
  let previous = timestamps[0];
  for (const timestamp of timestamps.slice(1)) {
    if (timestamp - previous > INTERVENTION_GAP_MS) {
      minutes += (previous - start) / 60_000 + MINUTES_PAR_INTERVENTION;
      start = timestamp;
    }
    previous = timestamp;
  }
  return minutes + (previous - start) / 60_000 + MINUTES_PAR_INTERVENTION;
};

const EMAIL_PATTERN = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu;
const PHONE_PATTERN = /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g;

/** Retire e-mails et téléphones d'un extrait, puis le tronque. */
export const toExcerpt = (text: string, maxLength: number): string => {
  const masked = text
    .replace(EMAIL_PATTERN, '[e-mail]')
    .replace(PHONE_PATTERN, '[téléphone]')
    .replace(/\s+/g, ' ')
    .trim();
  return masked.length > maxLength
    ? `${masked.slice(0, maxLength - 1)}…`
    : masked;
};

/** `count` éléments répartis régulièrement, pour ne pas sur-représenter une
 * période quand il faut échantillonner. */
export const spreadSample = <T>(items: T[], count: number): T[] => {
  if (items.length <= count) {
    return items;
  }
  const step = items.length / count;
  return Array.from(
    { length: count },
    (_, index) => items[Math.floor(index * step)]
  );
};

export const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Au moins un des termes figure dans le texte, sans tenir compte des accents
 * ni de la casse, en mot entier : « CR » ne trouve pas « crédit ».
 */
export const buildTermesMatcher = (
  termes: string[]
): ((text: string) => boolean) => {
  const patterns = termes
    .map((terme) => normalizeText(terme).trim())
    .filter(Boolean)
    .map(
      (terme) =>
        new RegExp(
          `(^|[^\\p{L}\\p{N}])${escapeRegExp(terme)}($|[^\\p{L}\\p{N}])`,
          'u'
        )
    );
  return (text) => {
    const normalized = normalizeText(text);
    return patterns.some((pattern) => pattern.test(normalized));
  };
};

export type ConversationSummary = {
  date: string;
  resolue: boolean;
  segments: string[];
  demande: string;
  reponseSupport: string | null;
};

const textMessages = (messages: CrispMessage[]): string[] =>
  messages
    .filter(
      (message) =>
        message.type === 'text' &&
        typeof message.content === 'string' &&
        message.content.trim()
    )
    .map((message) => message.content as string);

/**
 * Une conversation en quelques lignes : premiers messages de l'usager et
 * dernière réponse d'un opérateur humain, e-mails et téléphones masqués.
 */
export const summarizeConversation = (
  conversation: {
    created_at: number;
    state?: string;
    meta?: { segments?: string[] };
  },
  messages: CrispMessage[],
  { demandeMaxLength = 400, reponseMaxLength = 250 } = {}
): ConversationSummary => {
  const demande = textMessages(
    messages.filter((message) => message.from === 'user')
  ).slice(0, 3);
  const reponse = textMessages(
    messages.filter(
      (message) => isHumanOperatorMessage(message) && message.type === 'text'
    )
  ).at(-1);
  return {
    date: new Date(conversation.created_at).toISOString().slice(0, 10),
    resolue: conversation.state === 'resolved',
    segments: (conversation.meta?.segments ?? [])
      .map(parseSegment)
      .filter((segment) => segment.kind !== 'parcours')
      .map((segment) => segment.normalized),
    demande: toExcerpt(demande.join(' / '), demandeMaxLength),
    reponseSupport: reponse ? toExcerpt(reponse, reponseMaxLength) : null,
  };
};
