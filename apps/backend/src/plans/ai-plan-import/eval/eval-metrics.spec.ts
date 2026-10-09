import { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { describe, expect, it } from 'vitest';
import {
  createUnenrichedSousAction,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../models/extracted-action';
import {
  compareWithManualReference,
  compareWithReference,
  computeEvalMetrics,
  ManualReference,
} from './eval-metrics';
import { titlesMatch } from '../pipeline/extract-actions/similar-titles';

const anAction = (
  titre: string,
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre,
    ...overrides,
  });

const anEvent = (overrides: Partial<LlmCallEvent> = {}): LlmCallEvent => ({
  tier: 'strong',
  model: 'test-model',
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

describe('titlesMatch', () => {
  it.each([
    [
      '1.1 Ancrer l’administration dans l’éco-responsabilité',
      "1 Ancrer l'administration dans l'écoresponsabilité",
    ],
    [
      'ACCOMPAGNER LE DÉPLOIEMENT DE MOTORISATIONS PROPRES',
      '18 Accompagner le déploiement de motorisations alternatives',
    ],
    ['Axe 1 : Tous héros ordinaires', 'I. TOUS HÉROS ORDINAIRES'],
  ])('rapproche « %s » et « %s »', (a, b) => {
    expect(titlesMatch(a, b)).toBe(true);
  });

  it('distingue deux actions voisines', () => {
    expect(
      titlesMatch('Eco-rénover l’habitat social', 'Eco-rénover l’habitat privé')
    ).toBe(false);
  });
});

describe('compareWithManualReference', () => {
  const reference: ManualReference = {
    manual: true,
    document: 'test',
    axes: ['I. Bâtiments', 'II. Mobilité'],
    actions: [
      { axe: 'I. Bâtiments', titre: '1 Rénover les écoles' },
      { axe: 'I. Bâtiments', titre: '2 Isoler la mairie' },
      { axe: 'II. Mobilité', titre: '3 Développer le covoiturage' },
    ],
  };
  const run = (actions: ExtractedAction[]) => {
    const draft = { actions, qualitativeReview: null };
    return {
      draft,
      metrics: computeEvalMetrics({ draft, events: [], durationMs: 10 }),
    };
  };

  it('compte les actions retrouvées, manquantes, mal rangées ou passées en sous-axe', () => {
    const diff = compareWithManualReference(
      run([
        anAction('Rénover les écoles', { axe: 'Axe 1 : Bâtiments' }),
        anAction('Organiser des trajets partagés', {
          axe: 'Axe 1 : Bâtiments',
          sousAxe: '1.2 Développer le covoiturage',
        }),
        anAction('Isoler la mairie', { axe: 'Axe 2 : Mobilité' }),
      ]),
      reference
    );

    expect(diff).toEqual({
      axes: { expected: 2, actual: 2, missing: [] },
      actions: { expected: 3, actual: 3, found: 2 },
      missingTitles: ['3 Développer le covoiturage'],
      extraTitles: ['Organiser des trajets partagés'],
      titlesFoundAsSousAxe: ['3 Développer le covoiturage'],
      misplacedTitles: [
        {
          titre: '2 Isoler la mairie',
          expectedAxe: 'I. Bâtiments',
          actualAxe: 'Axe 2 : Mobilité',
        },
      ],
    });
  });
});
