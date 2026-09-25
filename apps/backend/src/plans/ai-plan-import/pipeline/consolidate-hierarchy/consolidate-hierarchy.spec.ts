import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  createUnenrichedSousAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { applyHierarchy } from './apply-hierarchy';
import { consolidateHierarchy } from './consolidate-hierarchy';

const tokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const anAction = (
  titre: string,
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction => ({
  axe: 'Axe 1 : Bâtiments',
  sousAxe: '1.1 Rénover',
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

const skeleton = {
  axes: [
    {
      numero: '1',
      titre: 'Bâtiments',
      sousAxes: [{ numero: '1.1', titre: 'Rénover' }],
    },
    { numero: '2', titre: 'Mobilité', sousAxes: [] },
  ],
};

describe('applyHierarchy', () => {
  it('rattache, fusionne les doublons vers la première occurrence et garde les oubliés', () => {
    const actions = [
      anAction('1.1.1 Isoler', { axe: 'Bâtiments', sousAxe: '' }),
      anAction('Covoiturage', { axe: '', sousAxe: '', description: 'court' }),
      anAction('Covoiturage', {
        axe: 'Axe 2',
        description: 'description plus longue',
        sousActions: [createUnenrichedSousAction('étape')],
      }),
      anAction('Oubliée', { axe: 'Axe 3 : Eau' }),
    ];

    const outcome = applyHierarchy(actions, [
      {
        index: 0,
        axe: 'Axe 1 : Bâtiments',
        'sous-axe': '1.1  Rénover',
        doublonDe: -1,
      },
      { index: 1, axe: 'Axe 2 : Mobilité', 'sous-axe': '', doublonDe: -1 },
      { index: 2, axe: 'Axe 2 : Mobilité', 'sous-axe': '', doublonDe: 1 },
    ]);

    expect(outcome.keptIndexes).toEqual([0, 1, 3]);
    expect(
      outcome.actions.map((action) => [action.axe, action.sousAxe])
    ).toEqual([
      ['Axe 1 : Bâtiments', '1.1  Rénover'],
      ['Axe 2 : Mobilité', ''],
      ['Axe 3 : Eau', '1.1 Rénover'],
    ]);
    expect(outcome.actions[1].description).toBe('description plus longue');
    expect(outcome.actions[1].sousActions).toHaveLength(1);
  });

  it('ignore un doublon qui pointe vers lui-même ou vers plus loin', () => {
    const actions = [anAction('A'), anAction('B')];

    const outcome = applyHierarchy(actions, [
      { index: 0, axe: '', 'sous-axe': '', doublonDe: 1 },
      { index: 1, axe: '', 'sous-axe': '', doublonDe: 1 },
    ]);

    expect(outcome.keptIndexes).toEqual([0, 1]);
  });
});

describe('consolidateHierarchy', () => {
  it('envoie le squelette et les actions au palier fort, par lots, sans texte source', async () => {
    const calls: { prompt: string; tier?: string }[] = [];
    const llm = {
      generateStructured: vi.fn(
        async (call: { prompt: string; tier?: string }) => {
          calls.push(call);
          return success({
            data: [
              {
                index: 0,
                axe: 'Axe 1 : Bâtiments',
                'sous-axe': '1.1  Rénover',
                doublonDe: -1,
              },
            ],
            tokens,
          });
        }
      ),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await consolidateHierarchy(llm, {
      actions: [anAction('1.1.1 Isoler', { axe: '' })],
      skeleton,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ tier: 'strong' });
    expect(calls[0].prompt).toContain('agent de mise en cohérence');
    expect(calls[0].prompt).toContain('Axe 2 : Mobilité');
    expect(calls[0].prompt).toContain(
      '|0| (sans axe) > 1.1 Rénover > 1.1.1 Isoler'
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions[0].axe).toBe('Axe 1 : Bâtiments');
      expect(result.data.keptIndexes).toEqual([0]);
    }
  });

  it("propage l'erreur du modèle", async () => {
    const llm = {
      generateStructured: vi.fn(async () => failure({ kind: 'rate_limited' })),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    expect(
      await consolidateHierarchy(llm, { actions: [anAction('A')], skeleton })
    ).toMatchObject({ success: false, error: { kind: 'rate_limited' } });
  });
});
