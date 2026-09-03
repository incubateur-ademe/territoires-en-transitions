import { describe, expect, it } from 'vitest';
import {
  ActionConfidence,
  ExtractedAction,
} from '../../models/extracted-action';
import { updateActionsWithConsolidatedEntries } from './update-actions-with-consolidated-entries';

const confidence: ActionConfidence = {
  score: 60,
  explication: 'omissions',
  amelioree: false,
};

const anAction = (
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction => ({
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre: 'Ancien titre',
  description: 'Ancienne description',
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence,
  sousActions: [],
  ...overrides,
});

describe('updateActionsWithConsolidatedEntries', () => {
  it('réécrit titre/description/sous-actions et passe amelioree à true', () => {
    const result = updateActionsWithConsolidatedEntries(
      [anAction()],
      [
        {
          index: 0,
          titre: 'Nouveau titre',
          description: 'Nouvelle description',
          'sous-actions': ['Étape A', '  ', 'Étape B'],
        },
      ]
    );

    expect(result[0]).toMatchObject({
      titre: 'Nouveau titre',
      description: 'Nouvelle description',
      confidence: { score: 60, explication: 'omissions', amelioree: true },
    });
    expect(result[0].sousActions.map((sousAction) => sousAction.titre)).toEqual([
      'Étape A',
      'Étape B',
    ]);
  });

  it('met la description à null quand la consolidation la laisse vide', () => {
    const result = updateActionsWithConsolidatedEntries(
      [anAction()],
      [{ index: 0, titre: 'T', description: '   ', 'sous-actions': [] }]
    );

    expect(result[0].description).toBeNull();
  });

  it('laisse inchangée une action non retournée par la consolidation', () => {
    const original = anAction();
    const result = updateActionsWithConsolidatedEntries([original], []);

    expect(result[0]).toEqual(original);
  });
});
