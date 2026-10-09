import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { ExtractedAction } from '../models/extracted-action';
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
