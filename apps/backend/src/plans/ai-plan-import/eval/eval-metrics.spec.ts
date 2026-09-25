import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { describe, expect, it } from 'vitest';
import {
  createUnenrichedSousAction,
  ExtractedAction,
} from '../models/extracted-action';
import { compareWithReference, computeEvalMetrics } from './eval-metrics';

const anAction = (
  titre: string,
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction => ({
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre,
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
  ...overrides,
});

const anEvent = (overrides: Partial<LlmCallEvent> = {}): LlmCallEvent => ({
  attempt: 1,
  durationMs: 100,
  promptChars: 1000,
  usage: {
    promptTokens: 10,
    cachedTokens: 0,
    candidatesTokens: 5,
    thoughtsTokens: 0,
    totalTokens: 15,
  },
  error: null,
  ...overrides,
});

describe('computeEvalMetrics', () => {
  it('compte actions, axes, sous-axes, sous-actions et taux de remplissage', () => {
    const metrics = computeEvalMetrics({
      draft: {
        actions: [
          anAction('A', {
            description: 'desc',
            budget: 1000,
            sousActions: [createUnenrichedSousAction('a1')],
          }),
          anAction('B', { axe: 'Axe 2', sousAxe: '2.1', description: '' }),
          anAction('C', { axe: '', sousAxe: '' }),
        ],
        qualitativeReview: null,
      },
      events: [],
      durationMs: 42,
    });

    expect(metrics).toMatchObject({
      actions: 3,
      actionsSansAxe: 1,
      axes: 2,
      sousAxes: 2,
      sousActions: 1,
      durationMs: 42,
    });
    expect(metrics.fillRates.description).toBeCloseTo(1 / 3);
    expect(metrics.fillRates.budget).toBeCloseTo(1 / 3);
    expect(metrics.fillRates.objectifs).toBe(0);
  });

  it('compte les appels, les 429 et additionne les tokens', () => {
    const metrics = computeEvalMetrics({
      draft: { actions: [], qualitativeReview: null },
      events: [
        anEvent(),
        anEvent({ error: { kind: 'rate_limited' }, usage: null }),
        anEvent({ attempt: 2 }),
      ],
      durationMs: 0,
    });

    expect(metrics.calls).toBe(3);
    expect(metrics.rateLimited).toBe(1);
    expect(metrics.failedCalls).toBe(1);
    expect(metrics.tokens.totalTokens).toBe(30);
  });
});

describe('compareWithReference', () => {
  it('donne les écarts et les titres manquants ou en trop, sans tenir compte de la numérotation', () => {
    const run = (titres: string[]) => {
      const draft = {
        actions: titres.map((t) => anAction(t)),
        qualitativeReview: null,
      };
      return {
        draft,
        metrics: computeEvalMetrics({ draft, events: [], durationMs: 10 }),
      };
    };

    const diff = compareWithReference(
      run(['1.1.1 Rénover les écoles', 'Nouvelle action']),
      run(['Rénover les écoles', 'Planter des arbres', 'Isoler la mairie'])
    );

    expect(diff.deltas.actions).toBe(-1);
    expect(diff.missingTitles).toEqual([
      'Planter des arbres',
      'Isoler la mairie',
    ]);
    expect(diff.extraTitles).toEqual(['Nouvelle action']);
  });
});
