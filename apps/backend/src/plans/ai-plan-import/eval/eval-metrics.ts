import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { axisPathOf, ExtractedAction } from '../models/extracted-action';
import { PlanDraft } from '../models/plan-draft';
import {
  computeContentMetrics,
  computeLlmCallMetrics,
  FILL_RATE_FIELDS,
  FillRateField,
} from '../pipeline/compute-import-metrics';
import { titlesMatch } from '../pipeline/extract-actions/similar-titles';

export type { FillRateField };

export type EvalMetrics = {
  actions: number;
  actionsSansAxe: number;
  axes: number;
  sousAxes: number;
  /** Absente des résultats enregistrés avant les chemins d'axes complets. */
  profondeurAxes?: number;
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
  deltas: Record<
    keyof Omit<EvalMetrics, 'fillRates' | 'tokens' | 'profondeurAxes'>,
    number
  >;
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
  const { calls, rateLimited, failedCalls, tokens } =
    computeLlmCallMetrics(events);
  return {
    ...computeContentMetrics(draft.actions),
    calls,
    rateLimited,
    failedCalls,
    tokens,
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
  /**
   * `cheminAxes`, quand le plan a plus d'un niveau d'axes, donne le chemin
   * complet attendu ; il commence par `axe`.
   */
  actions: { axe: string; titre: string; cheminAxes?: string[] }[];
};

export type ManualReferenceDiff = {
  axes: { expected: number; actual: number; missing: string[] };
  actions: { expected: number; actual: number; found: number };
  /**
   * Nombre de niveaux d'axes distincts à chaque profondeur, attendus et
   * obtenus ; `null` pour une référence sans chemins complets.
   */
  axisLevels: { expected: number[]; actual: number[] } | null;
  missingTitles: string[];
  extraTitles: string[];
  /** Titres attendus retrouvés en sous-axe : le modèle a inventé un niveau. */
  titlesFoundAsSousAxe: string[];
  /** Actions retrouvées sous un autre axe que celui attendu. */
  misplacedTitles: { titre: string; expectedAxe: string; actualAxe: string }[];
  /** Actions sous le bon axe, mais à un autre chemin que celui attendu. */
  misplacedPaths: { titre: string; expectedPath: string; actualPath: string }[];
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
  const matches = matchExpectedActions(reference.actions, actions);
  const matched = new Set(matches.map(({ action }) => action));
  const missing = matches.filter(({ action }) => !action);
  const expectedPaths = reference.actions.flatMap(({ cheminAxes }) =>
    cheminAxes ? [cheminAxes] : []
  );

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
    axisLevels:
      expectedPaths.length > 0
        ? {
            expected: countAxisLevels(expectedPaths),
            actual: countAxisLevels(actions.map(axisPathOf)),
          }
        : null,
    missingTitles: missing.map(({ expected }) => expected.titre),
    extraTitles: actions
      .filter((action) => !matched.has(action))
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
    misplacedPaths: matches.flatMap(({ expected, action }) =>
      action &&
      expected.cheminAxes &&
      titlesMatch(action.axe, expected.axe) &&
      !pathsMatch(axisPathOf(action), expected.cheminAxes)
        ? [
            {
              titre: expected.titre,
              expectedPath: expected.cheminAxes.join(' > '),
              actualPath: axisPathOf(action).join(' > '),
            },
          ]
        : []
    ),
  };
};

/**
 * Une action obtenue ne répond qu'à une action attendue : deux fiches
 * homonymes sous deux chemins différents en demandent deux. À titre égal,
 * celle qui est rangée au bon endroit est préférée.
 */
const matchExpectedActions = (
  expectedActions: ManualReference['actions'],
  actions: ExtractedAction[]
) => {
  const taken = new Set<ExtractedAction>();
  const take = (
    expected: ManualReference['actions'][number],
    isWellPlaced: boolean
  ): ExtractedAction | undefined => {
    const action = actions.find(
      (candidate) =>
        !taken.has(candidate) &&
        titlesMatch(candidate.titre, expected.titre) &&
        (!isWellPlaced || isPlacedAsExpected(candidate, expected))
    );
    if (action) {
      taken.add(action);
    }
    return action;
  };
  // Les actions bien rangées d'abord : sinon un homonyme mal rangé peut
  // prendre la place de celui qui est au bon endroit.
  const wellPlaced = expectedActions.map((expected) => take(expected, true));
  return expectedActions.map((expected, index) => ({
    expected,
    action: wellPlaced[index] ?? take(expected, false),
  }));
};

const isPlacedAsExpected = (
  action: ExtractedAction,
  expected: ManualReference['actions'][number]
): boolean =>
  expected.cheminAxes
    ? pathsMatch(axisPathOf(action), expected.cheminAxes)
    : titlesMatch(action.axe, expected.axe);

const pathsMatch = (left: string[], right: string[]): boolean =>
  left.length === right.length &&
  left.every((segment, index) => titlesMatch(segment, right[index]));

/** Le nombre d'axes distincts à chaque profondeur. */
export const countAxisLevels = (paths: string[][]): number[] =>
  Array.from(
    { length: Math.max(0, ...paths.map((path) => path.length)) },
    (_, depth) =>
      new Set(
        paths
          .filter((path) => path.length > depth)
          .map((path) =>
            path
              .slice(0, depth + 1)
              .map((segment) => segment.trim().toLowerCase())
              .join(' > ')
          )
      ).size
  );

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
