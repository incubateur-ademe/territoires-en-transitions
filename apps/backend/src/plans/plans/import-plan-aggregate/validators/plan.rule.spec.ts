import { describe, expect, it } from 'vitest';
import { ImportPlanInput } from '../import-plan.input';
import {
  ImportActionInput,
  ImportActionOrSousAction,
  ImportSousActionInput,
} from '../schemas/import-action.input';
import { validateImportPlanInput } from './plan.rule';

describe('validateImportedPlan', () => {
  const createValidPlan = (
    overrides?: Partial<ImportPlanInput>
  ): ImportPlanInput => ({
    nom: 'Mon Plan',
    typeId: 1,
    pilotes: [],
    referents: [],
    actions: [],
    ...overrides,
  });

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

  const createValidSousAction = (
    overrides?: Partial<ImportSousActionInput>
  ): ImportSousActionInput =>
    ({
      axisPath: ['Axe 1'],
      titre: 'Sous-action',
      parentActionTitre: 'Action parente',
      description: 'Description',
      pilotes: [],
      referents: [],
      structures: [],
      services: [],
      financeurs: [],
      partenaires: [],
      ...overrides,
    } as ImportSousActionInput);

  describe('Plan type validation', () => {
    it('should pass for a valid plan type', async () => {
      const plan = createValidPlan({ typeId: 1 });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });

    it('should pass when typeId is undefined', async () => {
      const plan = createValidPlan({ typeId: undefined });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });

    it('should fail for a negative plan type', async () => {
      const plan = createValidPlan({ typeId: -1 });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidPlanType');
        expect(result.error.message).toContain('Type de plan invalide');
        if (result.error._tag === 'InvalidPlanType') {
          expect(result.error.typeId).toBe(-1);
        }
      }
    });

    it('should fail for a non-integer plan type', async () => {
      const plan = createValidPlan({ typeId: 1.5 });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidPlanType');
      }
    });

    it('should pass for typeId of 0', async () => {
      const plan = createValidPlan({ typeId: 0 });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });
  });

  describe('Actions validation', () => {
    it('should pass for a plan with no actions', async () => {
      const plan = createValidPlan({ actions: [] });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });

    it('should pass for a plan with one valid action', async () => {
      const action = createValidAction({ titre: 'Action 1' });
      const plan = createValidPlan({ actions: [action] });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });

    it('should pass for a plan with multiple valid actions', async () => {
      const actions = [
        createValidAction({ titre: 'Action 1' }),
        createValidAction({ titre: 'Action 2' }),
        createValidAction({ titre: 'Action 3' }),
      ];
      const plan = createValidPlan({ actions });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });

    it('should fail if any action is invalid', async () => {
      const actions = [
        createValidAction({ titre: 'Action valide 1' }),
        createValidAction({ titre: '' }), // Invalid: empty title
        createValidAction({ titre: 'Action valide 2' }),
      ];
      const plan = createValidPlan({ actions });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidActionTitre');
      }
    });

    it('should fail if an action has invalid dates', async () => {
      const action = createValidAction({
        dateDebut: new Date('2024-12-31'),
        dateFin: new Date('2024-01-01'),
      });
      const plan = createValidPlan({ actions: [action] });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidDateRange');
      }
    });

    it('should fail if an action has negative budget', async () => {
      const action = createValidAction({ budget: -1000 });
      const plan = createValidPlan({ actions: [action] });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('InvalidBudget');
      }
    });
  });

  describe('Parent action existence validation', () => {
    it('should pass when a sous-action has a dedicated parent row', async () => {
      const actions: ImportActionOrSousAction[] = [
        createValidAction({
          axisPath: ['Axe 1'],
          titre: 'Action parente',
        }),
        createValidSousAction({
          axisPath: ['Axe 1'],
          titre: 'Sous-action 1.1',
          parentActionTitre: 'Action parente',
        }),
      ];
      const plan = createValidPlan({ actions });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });

    it('should fail when a sous-action has no dedicated parent row', async () => {
      const actions: ImportActionOrSousAction[] = [
        createValidSousAction({
          axisPath: ['Axe 1'],
          titre: 'Sous-action 1.1',
          parentActionTitre: 'Action parente',
        }),
      ];
      const plan = createValidPlan({ actions });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('ParentActionNotFound');
        expect(result.error.message).toEqual(
          'Sous-action(s) sans action parente trouvée(s) : "Sous-action 1.1"'
        );
      }
    });

    it('should fail when parent row is in a different axis than the sous-action', async () => {
      const actions: ImportActionOrSousAction[] = [
        createValidAction({
          axisPath: ['Axe 1'],
          titre: 'Action parente',
        }),
        createValidSousAction({
          axisPath: ['Axe 2'],
          titre: 'Sous-action 1.1',
          parentActionTitre: 'Action parente',
        }),
      ];
      const plan = createValidPlan({ actions });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error._tag).toBe('ParentActionNotFound');
      }
    });

    it('should pass when multiple sous-actions share a dedicated parent row in same axis', async () => {
      const actions: ImportActionOrSousAction[] = [
        createValidAction({
          axisPath: ['Axe 1'],
          titre: 'Action parente',
        }),
        createValidSousAction({
          axisPath: ['Axe 1'],
          titre: 'Sous-action 1.1',
          parentActionTitre: 'Action parente',
        }),
        createValidSousAction({
          axisPath: ['Axe 1'],
          titre: 'Sous-action 1.2',
          parentActionTitre: 'Action parente',
        }),
      ];
      const plan = createValidPlan({ actions });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });

    it('should pass when same parent title exists in different axes each with their own dedicated row', async () => {
      const actions: ImportActionOrSousAction[] = [
        createValidAction({
          axisPath: ['Axe 1'],
          titre: 'Action parente',
        }),
        createValidSousAction({
          axisPath: ['Axe 1'],
          titre: 'Sous-action A',
          parentActionTitre: 'Action parente',
        }),
        createValidAction({
          axisPath: ['Axe 2'],
          titre: 'Action parente',
        }),
        createValidSousAction({
          axisPath: ['Axe 2'],
          titre: 'Sous-action B',
          parentActionTitre: 'Action parente',
        }),
      ];
      const plan = createValidPlan({ actions });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });
  });

  describe('Combined validation', () => {
    it('should return plan error before action errors', async () => {
      const action = createValidAction({ titre: '' }); // Invalid action
      const plan = createValidPlan({
        typeId: -5, // Invalid plan type
        actions: [action],
      });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Plan validation is checked first
        expect(result.error._tag).toBe('InvalidPlanType');
      }
    });

    it('should pass for a complete valid plan with all metadata', async () => {
      const actions: ImportActionOrSousAction[] = [
        createValidAction({
          titre: 'Action 1',
          description: 'Description complète',
          dateDebut: new Date('2024-01-01'),
          dateFin: new Date('2024-06-30'),
          budget: 25000,
        }),
        createValidAction({
          titre: 'Action 2',
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
        actions,
      });

      const result = await validateImportPlanInput(plan);

      expect(result.success).toBe(true);
    });
  });
});
