import { importPlanInputToCreatePlanAggregateInput } from '@tet/backend/plans/plans/import-plan-aggregate/adapters/import-plan-input-to-create-plan-aggregate-input';
import { describe, expect, it } from 'vitest';
import {
  createUnenrichedSousAction,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../models/extracted-action';
import { draftToImportPlanInput } from './draft-to-import-plan-input';

const toAction = (overrides: Partial<ExtractedAction> = {}): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Mobilité',
    sousAxe: 'Vélo',
    titre: 'Développer le réseau cyclable',
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

  it("porte les effets attendus jusqu'aux fiches à créer, sous-actions comprises", () => {
    const planInput = draftToImportPlanInput({
      planName: 'Plan',
      actions: [
        toAction({
          titre: 'Action 1',
          effetsAttendus: [24],
          sousActions: [createUnenrichedSousAction('Sous-action 1.1')],
        }),
        toAction({ titre: 'Action 2', effetsAttendus: [] }),
      ],
    });

    const created = importPlanInputToCreatePlanAggregateInput(
      planInput,
      planInput.actions.map((action) => ({
        titre: action.titre,
        axisPath: action.axisPath,
        pilotes: [],
        referents: [],
        structures: [],
        services: [],
        financeurs: [],
        partenaires: [],
        instanceGouvernance: [],
      })),
      1
    );

    expect(created.success).toBe(true);
    if (!created.success) return;
    expect(
      created.data.fiches.map(({ fiche }) => [
        fiche.titre,
        fiche.effetsAttendus,
      ])
    ).toEqual([
      ['Action 1', [{ id: 24 }]],
      ['Sous-action 1.1', [{ id: 24 }]],
      ['Action 2', undefined],
    ]);
  });
});
