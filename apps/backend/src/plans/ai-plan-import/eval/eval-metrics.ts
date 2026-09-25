import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import {
  emptyTokenUsage,
  sumTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { ExtractedAction } from '../models/extracted-action';
import { normalizeTitle } from '../pipeline/extract-actions/merge-chunk-actions';
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

export const compareWithReference = (
  actual: EvalRun,
  reference: EvalRun
): EvalDiff => {
  const actualTitles = new Set(actual.draft.actions.map(titleKey));
  const referenceTitles = new Set(reference.draft.actions.map(titleKey));
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
    missingTitles: reference.draft.actions
      .filter((action) => !actualTitles.has(titleKey(action)))
      .map((action) => action.titre),
    extraTitles: actual.draft.actions
      .filter((action) => !referenceTitles.has(titleKey(action)))
      .map((action) => action.titre),
  };
};

const titleKey = (action: ExtractedAction): string =>
  normalizeTitle(action.titre);

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
