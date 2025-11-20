import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { ActionDetailed } from '../use-snapshot';
import {
  actionMatchingFilter,
  hasDetailedSousActionOrInformedTache,
  hasNonInformedActionOrNonInformedChild,
} from './useTableData.helpers';

// Helper to create a mock action with default values
const createMockAction = (
  overrides: Partial<ActionDetailed> = {}
): ActionDetailed => {
  return {
    actionId: 'test_1.1',
    actionType: ActionTypeEnum.TACHE,
    identifiant: '1.1',
    nom: 'Test Action',
    description: 'Description de la test',
    pointReferentiel: 1,
    pointPotentiel: 1,
    pointPotentielPerso: null,
    completedTachesCount: 0,
    totalTachesCount: 1,
    actionsEnfant: [],
    score: {
      actionId: 'test_1.1',
      pointReferentiel: 1,
      pointPotentiel: 1,
      pointPotentielPerso: null,
      pointFait: 0,
      pointPasFait: 0,
      pointProgramme: 0,
      pointNonRenseigne: 1,
      totalTachesCount: 1,
      completedTachesCount: 0,
      faitTachesAvancement: 0,
      programmeTachesAvancement: 0,
      pasFaitTachesAvancement: 0,
      pasConcerneTachesAvancement: 0,
      concerne: true,
      desactive: false,
      renseigne: false,
      avancement: undefined,
    },
    ...overrides,
  } as ActionDetailed;
};

describe('useTableData - Helper Functions', () => {
  describe('flatMapActionsEnfants', () => {
    it('should return action itself when action has no children', () => {
      const action = createMockAction();
      const result = flatMapActionsEnfants(action);
      expect(result).toHaveLength(1);
      expect(result[0].actionId).toBe('test_1.1');
    });

    it('should return action and all children in flat array', () => {
      const child1 = createMockAction({ actionId: 'test_1.1.1' });
      const child2 = createMockAction({ actionId: 'test_1.1.2' });
      const action = createMockAction({
        actionsEnfant: [child1, child2],
      });

      const result = flatMapActionsEnfants(action);
      expect(result).toHaveLength(3); // action + 2 children
      expect(result[0].actionId).toBe('test_1.1'); // parent first
      expect(result[1].actionId).toBe('test_1.1.1');
      expect(result[2].actionId).toBe('test_1.1.2');
    });

    it('should return action and nested children in flat array', () => {
      const grandchild = createMockAction({ actionId: 'test_1.1.1.1' });
      const child = createMockAction({
        actionId: 'test_1.1.1',
        actionsEnfant: [grandchild],
      });
      const action = createMockAction({
        actionsEnfant: [child],
      });

      const result = flatMapActionsEnfants(action);
      expect(result).toHaveLength(3); // action + child + grandchild
      expect(result[0].actionId).toBe('test_1.1');
      expect(result[1].actionId).toBe('test_1.1.1');
      expect(result[2].actionId).toBe('test_1.1.1.1');
    });
  });

  describe('hasNonInformedActionOrNonInformedChild', () => {
    it('should return false when action has no sous-actions', () => {
      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [
          createMockAction({
            actionType: ActionTypeEnum.TACHE,
            score: { ...createMockAction().score, renseigne: false },
          }),
        ],
      });

      expect(hasNonInformedActionOrNonInformedChild(action)).toBe(false);
    });

    it('should return true when sous-action is non renseignée and concerned with no children', () => {
      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
          avancement: undefined,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasNonInformedActionOrNonInformedChild(action)).toBe(true);
    });

    it('should return true when sous-action has non renseignée child', () => {
      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [tache],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasNonInformedActionOrNonInformedChild(action)).toBe(true);
    });

    it('should return false when sous-action is not concerned', () => {
      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [],
        score: {
          ...createMockAction().score,
          concerne: false,
          renseigne: false,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasNonInformedActionOrNonInformedChild(action)).toBe(false);
    });

    it('should return false when sous-action is renseignée', () => {
      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: 'fait' as const,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasNonInformedActionOrNonInformedChild(action)).toBe(false);
    });
  });

  describe('hasDetailedSousActionOrInformedTache', () => {
    it('should return false when action has no children', () => {
      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [],
      });

      expect(hasDetailedSousActionOrInformedTache(action)).toBe(false);
    });

    it('should return true when sous-action has détaillé status', () => {
      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          avancement: StatutAvancementEnum.DETAILLE,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasDetailedSousActionOrInformedTache(action)).toBe(true);
    });

    it('should return true when sous-action is not renseignée but has renseignée child', () => {
      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [tache],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasDetailedSousActionOrInformedTache(action)).toBe(true);
    });

    it('should return false when sous-action is not concerned', () => {
      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          concerne: false,
          renseigne: false,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasDetailedSousActionOrInformedTache(action)).toBe(false);
    });

    it('should return false when sous-action is renseignée without détaillé status', () => {
      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(hasDetailedSousActionOrInformedTache(action)).toBe(false);
    });
  });
});

describe('useTableData - actionMatchingFilter', () => {
  // Helper function to create a filter with specific statuts
  const createFilterFunction = (filters: { statut: string[] }) => {
    return (action: ActionDetailed) => {
      return actionMatchingFilter(action, filters.statut);
    };
  };

  describe('Filter: tous', () => {
    it('should return true for any action when "tous" is in filter', () => {
      const filter = createFilterFunction({ statut: ['tous'] });

      const action = createMockAction({ actionType: ActionTypeEnum.TACHE });
      expect(filter(action)).toBe(true);
    });
  });

  describe('Filter: TACHE', () => {
    it('should filter tache with non_concerne status', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_CONCERNE],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: false,
        },
      });

      expect(filter(tache)).toBe(true);
    });

    it('should filter tache with non_renseigne status', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_RENSEIGNE],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
        },
      });

      expect(filter(tache)).toBe(true);
    });

    it('should filter tache with fait status', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      expect(filter(tache)).toBe(true);
    });

    it('should not filter tache with fait when looking for pas_fait', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.PAS_FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      expect(filter(tache)).toBe(false);
    });

    it('should not filter non-concerned tache when not filtering for non_concerne', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: false,
        },
      });

      expect(filter(tache)).toBe(false);
    });
  });

  describe('Filter: SOUS_ACTION', () => {
    it('should filter sous-action that is non concernée', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_CONCERNE],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          concerne: false,
        },
      });

      expect(filter(sousAction)).toBe(true);
    });

    it('should filter sous-action with non concernée child', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_CONCERNE],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: false,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [tache],
        score: {
          ...createMockAction().score,
          concerne: true,
        },
      });

      expect(filter(sousAction)).toBe(true);
    });

    it('should filter non renseignée sous-action with no children', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_RENSEIGNE],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionId: 'test_1.1.1',
        actionsEnfant: [],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
        },
      });

      // flatMapActionsEnfants includes the action itself, so this sous-action
      // will be included in the check and should be filtered
      expect(filter(sousAction)).toBe(true);
    });

    it('should filter détaillé sous-action', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.DETAILLE],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          avancement: StatutAvancementEnum.DETAILLE,
        },
      });

      expect(filter(sousAction)).toBe(true);
    });

    it('should filter sous-action with fait status', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      expect(filter(sousAction)).toBe(true);
    });

    it('should not filter sous-action with matching child when sous-action has no avancement', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [tache],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: undefined,
        },
      });

      // When sous-action has no avancement (undefined), the logic requires:
      // isConcerned && isRenseigne && isNotNonRenseigne
      // Since avancement is undefined, isNotNonRenseigne is false
      expect(filter(sousAction)).toBe(false);
    });

    it('should filter ACTION containing non renseignée sous-action with no children', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_RENSEIGNE],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionId: 'test_1.1.1',
        actionsEnfant: [],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(filter(action)).toBe(true);
    });

    it('should not filter renseignée sous-action when looking for non_renseigne', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_RENSEIGNE],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      expect(filter(sousAction)).toBe(false);
    });
  });

  describe('Filter: ACTION/AXE/SOUS_AXE', () => {
    it('should filter action with non concernée child', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_CONCERNE],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: false,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [tache],
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(filter(action)).toBe(true);
    });

    it('should filter action with non renseignée sous-action', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.NON_RENSEIGNE],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [],
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: false,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(filter(action)).toBe(true);
    });

    it('should filter action with détaillé sous-action', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.DETAILLE],
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        score: {
          ...createMockAction().score,
          avancement: StatutAvancementEnum.DETAILLE,
        },
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(filter(action)).toBe(true);
    });

    it('should filter action with fait child', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [tache],
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(filter(action)).toBe(true);
    });

    it('should not filter action without matching children', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.PAS_FAIT,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsEnfant: [tache],
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionsEnfant: [sousAction],
      });

      expect(filter(action)).toBe(false);
    });
  });

  describe('Filter: Multiple statuts', () => {
    it('should filter when any status matches', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT, StatutAvancementEnum.PROGRAMME],
      });

      const tache1 = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      const tache2 = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.PROGRAMME,
        },
      });

      expect(filter(tache1)).toBe(true);
      expect(filter(tache2)).toBe(true);
    });

    it('should not filter when no status matches', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT, StatutAvancementEnum.PROGRAMME],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.PAS_FAIT,
        },
      });

      expect(filter(tache)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown action type', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const action = createMockAction({
        actionType: 'UNKNOWN' as any,
      });

      expect(filter(action)).toBe(false);
    });

    it('should handle action with undefined avancement', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: undefined,
        },
      });

      expect(filter(tache)).toBe(false);
    });

    it('should handle deeply nested actions', () => {
      const filter = createFilterFunction({
        statut: [StatutAvancementEnum.FAIT],
      });

      const tache = createMockAction({
        actionType: ActionTypeEnum.TACHE,
        actionId: 'test_1.1.1.1',
        score: {
          ...createMockAction().score,
          concerne: true,
          renseigne: true,
          avancement: StatutAvancementEnum.FAIT,
        },
      });

      const sousAction = createMockAction({
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionId: 'test_1.1.1',
        actionsEnfant: [tache],
      });

      const action = createMockAction({
        actionType: ActionTypeEnum.ACTION,
        actionId: 'test_1.1',
        actionsEnfant: [sousAction],
      });

      const axe = createMockAction({
        actionType: ActionTypeEnum.AXE,
        actionId: 'test_1',
        actionsEnfant: [action],
      });

      expect(filter(axe)).toBe(true);
    });
  });
});
