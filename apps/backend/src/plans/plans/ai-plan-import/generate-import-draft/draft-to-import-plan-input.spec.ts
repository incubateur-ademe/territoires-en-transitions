import { describe, expect, it } from 'vitest';
import {
  createUnenrichedSousAction,
  ExtractedAction,
} from '../models/extracted-action';
import { draftToImportPlanInput } from './draft-to-import-plan-input';

const toAction = (overrides: Partial<ExtractedAction> = {}): ExtractedAction => ({
  axe: 'Mobilité',
  sousAxe: 'Vélo',
  titre: 'Développer le réseau cyclable',
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

describe('draftToImportPlanInput', () => {
  it('reporte le nom et le type de plan saisis', () => {
    const result = draftToImportPlanInput({
      actions: [],
      planName: 'Plan vélo 2026',
      planType: 4,
    });

    expect(result).toEqual({ nom: 'Plan vélo 2026', typeId: 4, actions: [] });
  });

  it('laisse typeId indéfini quand aucun type n est fourni', () => {
    const result = draftToImportPlanInput({ actions: [], planName: 'Plan' });

    expect(result.typeId).toBeUndefined();
  });

  it('aplatit chaque action puis ses sous-actions en lignes d import', () => {
    const result = draftToImportPlanInput({
      planName: 'Plan',
      actions: [
        toAction({
          titre: 'Action 1',
          sousActions: [
            createUnenrichedSousAction('Sous-action 1.1'),
            createUnenrichedSousAction('Sous-action 1.2'),
          ],
        }),
        toAction({ titre: 'Action 2' }),
      ],
    });

    expect(result.actions).toHaveLength(4);
    expect(result.actions.map((action) => action.titre)).toEqual([
      'Action 1',
      'Sous-action 1.1',
      'Sous-action 1.2',
      'Action 2',
    ]);
  });
});
