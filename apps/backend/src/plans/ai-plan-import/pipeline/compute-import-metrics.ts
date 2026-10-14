import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import {
  emptyTokenUsage,
  sumTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { ExtractedAction } from '../models/extracted-action';

/**
 * Mesures communes à l'éval et aux imports réels : mêmes définitions des deux
 * côtés, pour que leurs chiffres se comparent.
 */
export const FILL_RATE_FIELDS = [
  'description',
  'objectifs',
  'structurePilote',
  'directionServicePilote',
  'personnePilote',
  'budget',
  'statut',
] as const;

export type FillRateField = (typeof FILL_RATE_FIELDS)[number];

export type ContentMetrics = {
  actions: number;
  actionsSansAxe: number;
  axes: number;
  sousAxes: number;
  sousActions: number;
  /** Part des actions dont le champ est renseigné, entre 0 et 1. */
  fillRates: Record<FillRateField, number>;
};

export type LlmCallMetrics = {
  calls: number;
  rateLimited: number;
  failedCalls: number;
  tokens: TokenUsage;
  /** Modèles appelés, sans doublon, dans l'ordre du premier appel. */
  models: string[];
};

export const computeContentMetrics = (
  actions: ExtractedAction[]
): ContentMetrics => ({
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
});

export const computeLlmCallMetrics = (
  events: LlmCallEvent[]
): LlmCallMetrics => {
  const usages = events.flatMap((event) => (event.usage ? [event.usage] : []));
  return {
    calls: events.length,
    rateLimited: events.filter((event) => event.error?.kind === 'rate_limited')
      .length,
    failedCalls: events.filter((event) => event.error !== null).length,
    tokens: usages.length > 0 ? sumTokenUsage(usages) : emptyTokenUsage(),
    models: [...new Set(events.map((event) => event.model))],
  };
};

/**
 * Le détail des appels d'une étape, gardé dans son `details` : durées,
 * tentatives et un compteur par type d'erreur. Une erreur d'API compte sous
 * son statut HTTP quand il est connu (`errors_http_503`).
 */
export const computeLlmCallDetails = (
  events: LlmCallEvent[]
): Record<string, number> => {
  if (events.length === 0) {
    return {};
  }
  const details: Record<string, number> = {
    maxCallMs: Math.max(...events.map((event) => event.durationMs)),
    sumCallMs: events.reduce((total, event) => total + event.durationMs, 0),
    maxAttempt: Math.max(...events.map((event) => event.attempt)),
  };
  for (const { error } of events) {
    if (error) {
      const key = `errors_${llmErrorKey(error)}`;
      details[key] = (details[key] ?? 0) + 1;
    }
  }
  return details;
};

const llmErrorKey = (error: LlmError): string =>
  error.kind === 'api_error' && error.httpStatus !== null
    ? `http_${error.httpStatus}`
    : error.kind;

/** Cumule les appels de passages successifs d'un même import. */
export const sumLlmCallMetrics = (
  metrics: LlmCallMetrics[]
): LlmCallMetrics => ({
  calls: metrics.reduce((total, { calls }) => total + calls, 0),
  rateLimited: metrics.reduce(
    (total, { rateLimited }) => total + rateLimited,
    0
  ),
  failedCalls: metrics.reduce(
    (total, { failedCalls }) => total + failedCalls,
    0
  ),
  tokens:
    metrics.length > 0
      ? sumTokenUsage(metrics.map(({ tokens }) => tokens))
      : emptyTokenUsage(),
  models: [...new Set(metrics.flatMap(({ models }) => models))],
});

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
