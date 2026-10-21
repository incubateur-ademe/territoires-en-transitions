import { describe, expect, it } from 'vitest';
import {
  ActionConfidence,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { updateActionsWithConsolidatedEntries } from './update-actions-with-consolidated-entries';

const confidence: ActionConfidence = {
  score: 60,
  explication: 'omissions',
  amelioree: false,
};

const anAction = (overrides: Partial<ExtractedAction> = {}): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre: 'Ancien titre',
    description: 'Ancienne description',
    confidence,
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
          objectifs: '',
          'sous-actions': ['Étape A', '  ', 'Étape B'],
        },
      ]
    );

    expect(result[0]).toMatchObject({
      titre: 'Nouveau titre',
      description: 'Nouvelle description',
      confidence: { score: 60, explication: 'omissions', amelioree: true },
    });
    expect(result[0].sousActions.map((sousAction) => sousAction.titre)).toEqual(
      ['Étape A', 'Étape B']
    );
  });

  it('met la description à null quand la consolidation la laisse vide', () => {
    const result = updateActionsWithConsolidatedEntries(
      [anAction()],
      [
        {
          index: 0,
          titre: 'T',
          description: '   ',
          objectifs: '',
          'sous-actions': [],
        },
      ]
    );

    expect(result[0].description).toBeNull();
  });

  it('laisse inchangée une action non retournée par la consolidation', () => {
    const original = anAction();
    const result = updateActionsWithConsolidatedEntries([original], []);

    expect(result[0]).toEqual(original);
  });

  it('laisse intacte une action lue dans un tableur par le code', () => {
    const pinned = anAction({
      sourceTableur: { onglet: 'Suivi', premiereLigne: 5, derniereLigne: 7 },
    });

    const result = updateActionsWithConsolidatedEntries(
      [pinned],
      [
        {
          index: 0,
          titre: 'Réécrit',
          description: '',
          objectifs: '',
          'sous-actions': [],
        },
      ]
    );

    expect(result[0]).toEqual(pinned);
  });

  it('ajoute les objectifs retrouvés par la consolidation à ceux déjà relevés, sans doublon', () => {
    const result = updateActionsWithConsolidatedEntries(
      [anAction({ objectifs: '- Réduire les pesticides' })],
      [
        {
          index: 0,
          titre: 'T',
          description: '',
          objectifs:
            '- Réduire les pesticides\n- 2030 : -10 % de GES par rapport à 2015',
          'sous-actions': [],
        },
      ]
    );

    expect(result[0].objectifs).toBe(
      '- Réduire les pesticides\n- 2030 : -10 % de GES par rapport à 2015'
    );
  });

  it('garde les objectifs déjà relevés quand la consolidation n’en rend pas', () => {
    const result = updateActionsWithConsolidatedEntries(
      [anAction({ objectifs: '- Réduire les pesticides' })],
      [
        {
          index: 0,
          titre: 'T',
          description: '',
          objectifs: '',
          'sous-actions': [],
        },
      ]
    );

    expect(result[0].objectifs).toBe('- Réduire les pesticides');
  });
});
