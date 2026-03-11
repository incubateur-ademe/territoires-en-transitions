import { describe, expect, it } from 'vitest';
import {
  ImportActionInput,
  ImportActionOrSousAction,
} from '../schemas/import-action.input';
import { validateAction } from './action.validator';
describe('validateAction', () => {
  const createValidAction = (
    overrides?: Partial<ImportActionInput>
  ): ImportActionOrSousAction =>
    ({
      axisPath: ['Axe 1'],
      titre: 'Action valide',
      description: 'Description',
      pilotes: [],
      referents: [],
      structures: [],
      services: [],
      financeurs: [],
      partenaires: [],
      ...overrides,
    } as ImportActionOrSousAction);

  describe('Title validation', () => {
    it('should pass for a valid title', async () => {
      const action = createValidAction({ titre: 'Mon titre valide' });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should fail when title is empty', async () => {
      const action = createValidAction({ titre: '' });

      const result = await validateAction(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidActionTitre');
        expect(result.error.message).toContain('titre');
        if (result.error._tag === 'InvalidActionTitre') {
          expect(result.error.titre).toBe('');
        }
      }
    });

    it('should fail when title is only whitespace', async () => {
      const action = createValidAction({ titre: '   ' });

      const result = await validateAction(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidActionTitre');
      }
    });

    it('should fail when title is undefined', async () => {
      const action = createValidAction({ titre: undefined as any });

      const result = await validateAction(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidActionTitre');
      }
    });
  });

  describe('Date validation', () => {
    it('should pass when dateDebut is before dateFin', async () => {
      const action = createValidAction({
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-12-31'),
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should pass when dateDebut equals dateFin', async () => {
      const sameDate = new Date('2024-06-15');
      const action = createValidAction({
        dateDebut: sameDate,
        dateFin: sameDate,
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should fail when dateDebut is after dateFin', async () => {
      const action = createValidAction({
        dateDebut: new Date('2024-12-31'),
        dateFin: new Date('2024-01-01'),
      });

      const result = await validateAction(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidDateRange');
        expect(result.error.message).toContain('date');
        if (result.error._tag === 'InvalidDateRange') {
          expect(result.error.dateDebut).toEqual(new Date('2024-12-31'));
          expect(result.error.dateFin).toEqual(new Date('2024-01-01'));
        }
      }
    });

    it('should pass when only dateDebut is provided', async () => {
      const action = createValidAction({
        dateDebut: new Date('2024-01-01'),
        dateFin: undefined,
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should pass when only dateFin is provided', async () => {
      const action = createValidAction({
        dateDebut: undefined,
        dateFin: new Date('2024-12-31'),
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should pass when no dates are provided', async () => {
      const action = createValidAction({
        dateDebut: undefined,
        dateFin: undefined,
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });
  });

  describe('Budget validation', () => {
    it('should pass for a positive budget', async () => {
      const action = createValidAction({ budget: 10000 });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should pass for a zero budget', async () => {
      const action = createValidAction({ budget: 0 });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should fail for a negative budget', async () => {
      const action = createValidAction({ budget: -5000 });

      const result = await validateAction(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidBudget');
        expect(result.error.message).toContain('négatif');
        if (result.error._tag === 'InvalidBudget') {
          expect(result.error.value).toBe(-5000);
          expect(result.error.reason).toContain('négatif');
        }
      }
    });

    it('should pass when budget is undefined', async () => {
      const action = createValidAction({ budget: undefined });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should fail when budget exceeds max allowed value', async () => {
      const action = createValidAction({ budget: 1_000_000_000_000 });

      const result = await validateAction(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidBudget');
        expect(result.error.message).toContain('valeur maximale');
        if (result.error._tag === 'InvalidBudget') {
          expect(result.error.value).toBe(1_000_000_000_000);
          expect(result.error.reason).toContain('valeur maximale');
        }
      }
    });

    it('should pass when budget equals max allowed value', async () => {
      const action = createValidAction({ budget: 999_999_999_999 });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });
  });

  describe('Instance governance validation', () => {
    it('should pass for an action with instance governance', async () => {
      const action = createValidAction({
        instanceGouvernance: ['Comité de pilotage'],
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });

    it('should pass for an action with multiple instance governance values', async () => {
      const action = createValidAction({
        instanceGouvernance: [
          'Comité de pilotage',
          'Conseil municipal',
          'Commission de suivi',
        ],
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });
  });

  describe('Multiple validation errors', () => {
    it('should return the first validation error encountered', async () => {
      const action = createValidAction({
        titre: '', // Invalid
        budget: -100, // Also invalid
      });

      const result = await validateAction(action);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should return title error first (as it's checked first)
        expect(result.error._tag).toBe('InvalidActionTitre');
      }
    });
  });

  describe('Valid action with all fields', () => {
    it('should pass validation for a complete valid action', async () => {
      const action = createValidAction({
        titre: 'Action complète',
        description: 'Description complète',
        objectifs: 'Objectifs clairs',
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-12-31'),
        budget: 50000,
        pilotes: ['Pilote 1'],
        referents: ['Référent 1'],
        structures: ['Structure A'],
        services: ['Service B'],
        financeurs: [{ nom: 'ADEME', montant: 25000 }],
        partenaires: ['Partenaire C'],
        instanceGouvernance: ['Comité de pilotage', 'Conseil municipal'],
      });

      const result = await validateAction(action);

      expect(result.success).toBe(true);
    });
  });
});
