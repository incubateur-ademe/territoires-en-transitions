import { describe, expect, it } from 'vitest';
import { validatePlanAggregate } from './create-plan-aggregate.rule';
import {
  FicheWithRelationsAndAxisPath,
  PlanCreationData,
} from './create-plan-aggregate.types';

const validPlanData: PlanCreationData = {
  collectiviteId: 1,
  nom: 'Plan test',
};

describe('validatePlanAggregate', () => {
  describe('plan name', () => {
    it('should fail when plan name is empty', () => {
      const result = validatePlanAggregate(
        { ...validPlanData, nom: '' },
        [],
        []
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain(
        'Le nom du plan ne peut pas être vide'
      );
    });
  });

  describe('orphaned sous-actions', () => {
    it('should fail when a sous-action references a non-existent parent action', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action existante', pilotes: [], referents: [] },
        },
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Sous-action orpheline', pilotes: [], referents: [] },
          parentActionTitre: 'Action inexistante',
        },
      ];

      const result = validatePlanAggregate(validPlanData, [['Axe 1']], fiches);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Sous-actions sans action parente');
      expect(result.errors[0]).toContain('Action inexistante');
    });

    it('should pass when a sous-action references an existing parent action', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action parente', pilotes: [], referents: [] },
        },
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Sous-action valide', pilotes: [], referents: [] },
          parentActionTitre: 'Action parente',
        },
      ];

      const result = validatePlanAggregate(validPlanData, [['Axe 1']], fiches);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass when sous-action and parent both have no axis path', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          fiche: { titre: 'Action parente', pilotes: [], referents: [] },
        },
        {
          fiche: { titre: 'Sous-action valide', pilotes: [], referents: [] },
          parentActionTitre: 'Action parente',
        },
      ];

      const result = validatePlanAggregate(validPlanData, [], fiches);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when sous-action has no axis path but parent is in an axis', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action parente', pilotes: [], referents: [] },
        },
        {
          fiche: { titre: 'Sous-action orpheline', pilotes: [], referents: [] },
          parentActionTitre: 'Action parente',
        },
      ];

      const result = validatePlanAggregate(validPlanData, [['Axe 1']], fiches);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Sous-actions sans action parente');
    });

    it('should fail when parent action exists but in a different axis path', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action parente', pilotes: [], referents: [] },
        },
        {
          axisPath: ['Axe 2'],
          fiche: { titre: 'Sous-action orpheline', pilotes: [], referents: [] },
          parentActionTitre: 'Action parente',
        },
      ];

      const result = validatePlanAggregate(
        validPlanData,
        [['Axe 1'], ['Axe 2']],
        fiches
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Sous-actions sans action parente');
    });
  });

  describe('duplicate action keys', () => {
    it('should fail when two actions have the same titre under the same axis', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action dupliquée', pilotes: [], referents: [] },
        },
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action dupliquée', pilotes: [], referents: [] },
        },
      ];

      const result = validatePlanAggregate(validPlanData, [['Axe 1']], fiches);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Titres d'actions en doublon");
    });

    it('should pass when same titre exists under different axes', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action', pilotes: [], referents: [] },
        },
        {
          axisPath: ['Axe 2'],
          fiche: { titre: 'Action', pilotes: [], referents: [] },
        },
      ];

      const result = validatePlanAggregate(
        validPlanData,
        [['Axe 1'], ['Axe 2']],
        fiches
      );

      expect(result.isValid).toBe(true);
    });

    it('should not count sous-actions as duplicates of their parent', () => {
      const fiches: FicheWithRelationsAndAxisPath[] = [
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Action parente', pilotes: [], referents: [] },
        },
        {
          axisPath: ['Axe 1'],
          fiche: { titre: 'Sous-action', pilotes: [], referents: [] },
          parentActionTitre: 'Action parente',
        },
      ];

      const result = validatePlanAggregate(validPlanData, [['Axe 1']], fiches);

      expect(result.isValid).toBe(true);
    });
  });
});
