import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { isSousAction } from '@tet/backend/plans/plans/import-plan-aggregate/schemas/import-action.input';
import { validateImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/validators/plan.rules';
import { describe, expect, it } from 'vitest';
import {
  ExtractedAction,
  ExtractedSousAction,
} from '../models/extracted-action';
import { extractedActionToImportActions } from './extracted-action-to-import-action';

const aSousAction = (
  overrides: Partial<ExtractedSousAction> = {}
): ExtractedSousAction => ({
  titre: 'Déployer des lignes de covoiturage',
  description: null,
  personnePilote: null,
  statut: null,
  dateDebut: null,
  dateFin: null,
  ...overrides,
});

const anAction = (
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction => ({
  axe: 'Mobilité',
  sousAxe: 'Covoiturage',
  titre: 'Réduire l autosolisme',
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

describe('extractedActionToImportActions', () => {
  it('mappe une action (axisPath, statut, budget, pilote)', () => {
    const [action] = extractedActionToImportActions(
      anAction({
        statut: 'A discuter',
        budget: 24000,
        personnePilote: 'Jean Dupont',
        structurePilote: 'DDT',
        directionServicePilote: 'Service mobilité',
      })
    );

    expect(isSousAction(action)).toBe(false);
    expect(action).toMatchObject({
      axisPath: ['Mobilité', 'Covoiturage'],
      titre: 'Réduire l autosolisme',
      status: 'A discuter',
      budget: 24000,
      pilotes: ['Jean Dupont'],
      structures: ['DDT'],
      services: ['Service mobilité'],
    });
  });

  it('mappe une sous-action imbriquée qui hérite des axes de son action parente', () => {
    const [, sousAction] = extractedActionToImportActions(
      anAction({
        sousActions: [
          aSousAction({ dateDebut: '2025-01-01', statut: 'En cours' }),
        ],
      })
    );

    expect(isSousAction(sousAction)).toBe(true);
    if (isSousAction(sousAction)) {
      expect(sousAction).toMatchObject({
        axisPath: ['Mobilité', 'Covoiturage'],
        parentActionTitre: 'Réduire l autosolisme',
        titre: 'Déployer des lignes de covoiturage',
        status: 'En cours',
        dateDebut: new Date('2025-01-01'),
      });
    }
  });

  it('déplie une action en 1 action + N sous-actions partageant axisPath et parent', () => {
    const result = extractedActionToImportActions(
      anAction({
        sousActions: [
          aSousAction({ titre: 'Sous-action A' }),
          aSousAction({ titre: 'Sous-action B' }),
        ],
      })
    );

    expect(result).toHaveLength(3);
    const sousActions = result.filter(isSousAction);
    expect(sousActions).toHaveLength(2);
    expect(sousActions.map((sousAction) => sousAction.titre)).toEqual([
      'Sous-action A',
      'Sous-action B',
    ]);
    sousActions.forEach((sousAction) => {
      expect(sousAction.axisPath).toEqual(['Mobilité', 'Covoiturage']);
      expect(sousAction.parentActionTitre).toBe('Réduire l autosolisme');
    });
  });

  it('mappe statut null vers status undefined', () => {
    const [action] = extractedActionToImportActions(anAction());
    expect(action.status).toBeUndefined();
  });

  it('round-trip : un draft mappé passe validateImportPlanInput', () => {
    const planInput: ImportPlanInput = {
      nom: 'Plan importé',
      actions: [anAction({ sousActions: [aSousAction()] })].flatMap(
        extractedActionToImportActions
      ),
    };

    const result = validateImportPlanInput(planInput);
    expect(result.success).toBe(true);
  });
});
