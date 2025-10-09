import { describe, expect, it } from 'vitest';
import { PlanImport } from '../import-plan.dto';
import { FicheImport } from '../schemas/fiche-import.schema';
import { ValidationErrorCode } from '../types/validation-error';
import { validateImportedPlan } from './plan.validator';

describe('validateImportedPlan', () => {
  const createValidPlan = (overrides?: Partial<PlanImport>): PlanImport => ({
    nom: 'Mon Plan',
    typeId: 1,
    pilotes: [],
    referents: [],
    fiches: [],
    ...overrides,
  });

  const createValidFiche = (overrides?: Partial<FicheImport>): FicheImport =>
    ({
      axisPath: ['Axe 1'],
      titre: 'Fiche valide',
      description: 'Description',
      pilotes: [],
      referents: [],
      structures: [],
      services: [],
      financeurs: [],
      partenaires: [],
      ...overrides,
    } as FicheImport);

  describe('Plan type validation', () => {
    it('should pass for a valid plan type', async () => {
      const plan = createValidPlan({ typeId: 1 });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(true);
    });

    it('should pass when typeId is undefined', async () => {
      const plan = createValidPlan({ typeId: undefined });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(true);
    });

    it('should fail for a negative plan type', async () => {
      const plan = createValidPlan({ typeId: -1 });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ValidationErrorCode.INVALID_PLAN_TYPE);
        expect(result.error.message).toContain('type de plan');
        expect(result.error.field).toBe('typeId');
        expect(result.error.details?.providedType).toBe(-1);
      }
    });

    it('should fail for a non-integer plan type', async () => {
      const plan = createValidPlan({ typeId: 1.5 });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ValidationErrorCode.INVALID_PLAN_TYPE);
      }
    });

    it('should pass for typeId of 0', async () => {
      const plan = createValidPlan({ typeId: 0 });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(true);
    });
  });

  describe('Fiches validation', () => {
    it('should pass for a plan with no fiches', async () => {
      const plan = createValidPlan({ fiches: [] });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(true);
    });

    it('should pass for a plan with one valid fiche', async () => {
      const fiche = createValidFiche({ titre: 'Fiche 1' });
      const plan = createValidPlan({ fiches: [fiche] });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(true);
    });

    it('should pass for a plan with multiple valid fiches', async () => {
      const fiches = [
        createValidFiche({ titre: 'Fiche 1' }),
        createValidFiche({ titre: 'Fiche 2' }),
        createValidFiche({ titre: 'Fiche 3' }),
      ];
      const plan = createValidPlan({ fiches });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(true);
    });

    it('should fail if any fiche is invalid', async () => {
      const fiches = [
        createValidFiche({ titre: 'Fiche valide 1' }),
        createValidFiche({ titre: '' }), // Invalid: empty title
        createValidFiche({ titre: 'Fiche valide 2' }),
      ];
      const plan = createValidPlan({ fiches });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ValidationErrorCode.INVALID_FICHE_TITLE);
      }
    });

    it('should fail if a fiche has invalid dates', async () => {
      const fiche = createValidFiche({
        dateDebut: new Date('2024-12-31'),
        dateFin: new Date('2024-01-01'),
      });
      const plan = createValidPlan({ fiches: [fiche] });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ValidationErrorCode.INVALID_DATE_RANGE);
      }
    });

    it('should fail if a fiche has negative budget', async () => {
      const fiche = createValidFiche({ budget: -1000 });
      const plan = createValidPlan({ fiches: [fiche] });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ValidationErrorCode.INVALID_BUDGET);
      }
    });
  });

  describe('Combined validation', () => {
    it('should return plan error before fiche errors', async () => {
      const fiche = createValidFiche({ titre: '' }); // Invalid fiche
      const plan = createValidPlan({
        typeId: -5, // Invalid plan type
        fiches: [fiche],
      });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Plan validation is checked first
        expect(result.error.code).toBe(ValidationErrorCode.INVALID_PLAN_TYPE);
      }
    });

    it('should pass for a complete valid plan with all metadata', async () => {
      const fiches = [
        createValidFiche({
          titre: 'Fiche 1',
          description: 'Description complète',
          dateDebut: new Date('2024-01-01'),
          dateFin: new Date('2024-06-30'),
          budget: 25000,
        }),
        createValidFiche({
          titre: 'Fiche 2',
          description: 'Autre description',
          dateDebut: new Date('2024-07-01'),
          dateFin: new Date('2024-12-31'),
          budget: 30000,
        }),
      ];

      const plan = createValidPlan({
        nom: "Plan d'action climat",
        typeId: 2,
        pilotes: [{ userId: 'user-1', tagId: null }],
        referents: [{ userId: null, tagId: 100 }],
        fiches,
      });

      const result = await validateImportedPlan(plan);

      expect(result.success).toBe(true);
    });
  });
});
