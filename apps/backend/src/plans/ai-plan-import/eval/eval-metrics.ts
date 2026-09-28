import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import {
  emptyTokenUsage,
  sumTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { ExtractedAction } from '../models/extracted-action';
import { PlanDraft } from '../models/plan-draft';

const FILL_RATE_FIELDS = [
  'description',
  'objectifs',
  'structurePilote',
  'directionServicePilote',
  'personnePilote',
  'budget',
  'statut',
] as const;

export type FillRateField = (typeof FILL_RATE_FIELDS)[number];

export type EvalMetrics = {
  actions: number;
  actionsSansAxe: number;
  axes: number;
  sousAxes: number;
  sousActions: number;
  /** Part des actions dont le champ est renseigné, entre 0 et 1. */
  fillRates: Record<FillRateField, number>;
  calls: number;
  rateLimited: number;
  failedCalls: number;
  tokens: TokenUsage;
  durationMs: number;
};

export type EvalRun = {
  metrics: EvalMetrics;
  draft: PlanDraft;
};

export type EvalDiff = {
  deltas: Record<keyof Omit<EvalMetrics, 'fillRates' | 'tokens'>, number>;
  fillRateDeltas: Record<FillRateField, number>;
  /** Titres de la référence introuvables dans le résultat. */
  missingTitles: string[];
  /** Titres du résultat absents de la référence. */
  extraTitles: string[];
};

export const computeEvalMetrics = ({
  draft,
  events,
  durationMs,
}: {
  draft: PlanDraft;
  events: LlmCallEvent[];
  durationMs: number;
}): EvalMetrics => {
  const { actions } = draft;
  const usages = events.flatMap((event) => (event.usage ? [event.usage] : []));
  return {
    actions: actions.length,
    actionsSansAxe: actions.filter((action) => !action.axe.trim()).length,
    axes: distinctCount(actions.map((action) => action.axe)),
    sousAxes: distinctCount(
      actions
        .filter((action) => action.sousAxe.trim())
        .map((action) => `${action.axe}|${action.sousAxe}`)
    ),
    sousActions: actions.reduce(
      (total, action) => total + action.sousActions.length,
      0
    ),
    fillRates: Object.fromEntries(
      FILL_RATE_FIELDS.map((field) => [field, fillRate(actions, field)])
    ) as Record<FillRateField, number>,
    calls: events.length,
    rateLimited: events.filter((event) => event.error?.kind === 'rate_limited')
      .length,
    failedCalls: events.filter((event) => event.error !== null).length,
    tokens: usages.length > 0 ? sumTokenUsage(usages) : emptyTokenUsage(),
    durationMs,
  };
};

/**
 * La structure attendue d'un document, relevée à la main dans son sommaire :
 * sert à juger la structure, pas le contenu des fiches.
 */
export type ManualReference = {
  manual: true;
  document: string;
  axes: string[];
  actions: { axe: string; titre: string }[];
};

export type ManualReferenceDiff = {
  axes: { expected: number; actual: number; missing: string[] };
  actions: { expected: number; actual: number; found: number };
  missingTitles: string[];
  extraTitles: string[];
  /** Titres attendus retrouvés en sous-axe : le modèle a inventé un niveau. */
  titlesFoundAsSousAxe: string[];
  /** Actions retrouvées sous un autre axe que celui attendu. */
  misplacedTitles: { titre: string; expectedAxe: string; actualAxe: string }[];
};

export const isManualReference = (
  reference: EvalRun | ManualReference
): reference is ManualReference =>
  (reference as ManualReference).manual === true;

export const compareWithManualReference = (
  actual: EvalRun,
  reference: ManualReference
): ManualReferenceDiff => {
  const { actions } = actual.draft;
  const actualAxes = [...new Set(actions.map((action) => action.axe))];
  const matches = reference.actions.map((expected) => ({
    expected,
    action: actions.find((action) => titlesMatch(action.titre, expected.titre)),
  }));
  const missing = matches.filter(({ action }) => !action);

  return {
    axes: {
      expected: reference.axes.length,
      actual: actualAxes.length,
      missing: reference.axes.filter(
        (axe) => !actualAxes.some((actualAxe) => titlesMatch(actualAxe, axe))
      ),
    },
    actions: {
      expected: reference.actions.length,
      actual: actions.length,
      found: matches.length - missing.length,
    },
    missingTitles: missing.map(({ expected }) => expected.titre),
    extraTitles: actions
      .filter(
        (action) =>
          !reference.actions.some((expected) =>
            titlesMatch(action.titre, expected.titre)
          )
      )
      .map((action) => action.titre),
    titlesFoundAsSousAxe: missing
      .filter(({ expected }) =>
        actions.some((action) => titlesMatch(action.sousAxe, expected.titre))
      )
      .map(({ expected }) => expected.titre),
    misplacedTitles: matches.flatMap(({ expected, action }) =>
      action && !titlesMatch(action.axe, expected.axe)
        ? [
            {
              titre: expected.titre,
              expectedAxe: expected.axe,
              actualAxe: action.axe,
            },
          ]
        : []
    ),
  };
};

export const compareWithReference = (
  actual: EvalRun,
  reference: EvalRun
): EvalDiff => {
  const numericKeys = [
    'actions',
    'actionsSansAxe',
    'axes',
    'sousAxes',
    'sousActions',
    'calls',
    'rateLimited',
    'failedCalls',
    'durationMs',
  ] as const;

  return {
    deltas: Object.fromEntries(
      numericKeys.map((key) => [
        key,
        actual.metrics[key] - reference.metrics[key],
      ])
    ) as EvalDiff['deltas'],
    fillRateDeltas: Object.fromEntries(
      FILL_RATE_FIELDS.map((field) => [
        field,
        actual.metrics.fillRates[field] - reference.metrics.fillRates[field],
      ])
    ) as Record<FillRateField, number>,
    missingTitles: unmatchedTitles(
      reference.draft.actions,
      actual.draft.actions
    ),
    extraTitles: unmatchedTitles(actual.draft.actions, reference.draft.actions),
  };
};

const unmatchedTitles = (
  actions: ExtractedAction[],
  others: ExtractedAction[]
): string[] =>
  actions
    .filter(
      (action) =>
        !others.some((other) => titlesMatch(action.titre, other.titre))
    )
    .map((action) => action.titre);

// Deux titres reformulés gardent l'essentiel de leurs mots : « motorisations
// alternatives » et « motorisations propres » désignent la même action.
const TITLE_SIMILARITY_THRESHOLD = 0.6;
const STOP_WORDS = new Set(
  'le la les l de des du d et en a au aux pour sur un une dans par avec entre ses son sa leur leurs'.split(
    ' '
  )
);

/** Même titre à la numérotation, à la casse, aux accents et à la reformulation près. */
export const titlesMatch = (a: string, b: string): boolean => {
  const left = titleWords(a);
  const right = titleWords(b);
  if (left.size === 0 || right.size === 0) {
    return false;
  }
  const common = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size;
  return common / union >= TITLE_SIMILARITY_THRESHOLD;
};

const titleWords = (title: string): Set<string> =>
  new Set(
    title
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      // « Axe 2 : », « IV. », « 1.2.3 » : la numérotation n'est pas le titre.
      .replace(/^\s*(?:axe\s*)?(?:[ivx]+|\d+(?:\.\d+)*)\b\s*[:.)\-–—]?\s*/u, '')
      // « éco-rénover » et « écorénover » : un seul mot.
      .replace(/(\p{L})[-‐](\p{L})/gu, '$1$2')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
  );

const distinctCount = (values: string[]): number =>
  new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))
    .size;

const fillRate = (actions: ExtractedAction[], field: FillRateField): number => {
  if (actions.length === 0) {
    return 0;
  }
  const filled = actions.filter((action) => {
    const value = action[field];
    return typeof value === 'number' ? true : Boolean(value?.trim());
  }).length;
  return filled / actions.length;
};
