import { describe, expect, it } from 'vitest';
import { countActiveFicheFilters } from '../count-active-fiche-filters';
import { FormFilters } from '../types';

describe('countActiveFicheFilters', () => {
  describe('individual filters', () => {
    it('should return 0 for empty filters', () => {
      const filters: FormFilters = {} as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });

    it('should count single individual filter', () => {
      const filters: Partial<FormFilters> = {
        noPilote: true,
      };
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(1);
    });

    it('should ignore noPlan filter', () => {
      const filters: Partial<FormFilters> = {
        noPlan: true,
        statuts: ['En cours'],
      };

      const count = countActiveFicheFilters(filters as FormFilters);
      expect(count).toBe(1); // only statuts, noPlan is ignored
    });
    it('should count multiple individual filters and handle default values from checkbox filters', () => {
      const onlyTwoFilters: Partial<FormFilters> = {
        noPilote: true,
        ameliorationContinue: true,
        restreint: false,
      };
      const threeFilters = {
        ...onlyTwoFilters,
        restreint: true,
      };

      /**
       * "restreint" is false by default, so it should not be counted when it's false
       */
      expect(countActiveFicheFilters(onlyTwoFilters as FormFilters)).toBe(2);
      expect(countActiveFicheFilters(threeFilters as FormFilters)).toBe(3);
    });

    it('should ignore undefined and null values', () => {
      const filters: Partial<FormFilters> = {
        noPilote: true,
        //force null value
        ameliorationContinue: null as unknown as boolean,
        restreint: true,
      };
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(2);
    });

    it('should count array filters with content', () => {
      const filters: Partial<FormFilters> = {
        ficheIds: [1, 2, 3],
        thematiqueIds: [5],
      };
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(2);
    });

    it('should ignore empty arrays', () => {
      const filters: FormFilters = {
        ficheIds: [],
        thematiqueIds: [5],
        texteNomOuDescription: 'test',
      } as unknown as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(2);
    });
  });

  describe('combined filters', () => {
    it('should count pilotes as one category when both are present', () => {
      const filters: FormFilters = {
        utilisateurPiloteIds: ['user1', 'user2'],
        personnePiloteIds: [1, 2, 3],
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count pilotes as one category when only utilisateurPiloteIds is present', () => {
      const filters: FormFilters = {
        utilisateurPiloteIds: ['user1', 'user2'],
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count pilotes as one category when only personnePiloteIds is present', () => {
      const filters: FormFilters = {
        personnePiloteIds: [1, 2, 3],
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count referents as one category when both are present', () => {
      const filters: FormFilters = {
        utilisateurReferentIds: ['user1'],
        personneReferenteIds: [1, 2],
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count referents as one category when only utilisateurReferentIds is present', () => {
      const filters: FormFilters = {
        utilisateurReferentIds: ['user1'],
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count referents as one category when only personneReferenteIds is present', () => {
      const filters: FormFilters = {
        personneReferenteIds: [1, 2],
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count multiple combined categories', () => {
      const filters: FormFilters = {
        utilisateurPiloteIds: ['user1'],
        personnePiloteIds: [1],
        utilisateurReferentIds: ['user2'],
        personneReferenteIds: [2],
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(2);
    });
  });

  describe('period filters', () => {
    it('should count period as one filter when typePeriode and debutPeriode are present', () => {
      const filters: FormFilters = {
        typePeriode: 'creation',
        debutPeriode: '2024-01-01T00:00:00Z',
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count period as one filter when typePeriode and finPeriode are present', () => {
      const filters: FormFilters = {
        typePeriode: 'modification',
        finPeriode: '2024-12-31T23:59:59Z',
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should count period as one filter when all three are present', () => {
      const filters: FormFilters = {
        typePeriode: 'debut',
        debutPeriode: '2024-01-01T00:00:00Z',
        finPeriode: '2024-12-31T23:59:59Z',
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(1);
    });

    it('should NOT count typePeriode as no filter when no date is present', () => {
      const filters: FormFilters = {
        typePeriode: 'fin',
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });

    it('should NOT count debutPeriode as individual filter when no typePeriode is present', () => {
      const filters: FormFilters = {
        debutPeriode: '2024-01-01T00:00:00Z',
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });

    it('should NOT count finPeriode as individual filter when no typePeriode is present', () => {
      const filters: FormFilters = {
        finPeriode: '2024-12-31T23:59:59Z',
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });

    it('should NOTcount both date fields as individual filters when no typePeriode is present', () => {
      const filters: FormFilters = {
        debutPeriode: '2024-01-01T00:00:00Z',
        finPeriode: '2024-12-31T23:59:59Z',
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });

    it('should ignore undefined period values', () => {
      const filters: FormFilters = {
        typePeriode: 'creation',
        debutPeriode: undefined,
        finPeriode: undefined,
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });

    it('should ignore null period values', () => {
      const filters: FormFilters = {
        typePeriode: 'modification',
        debutPeriode: null as any,
        finPeriode: null as any,
      } as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });
  });

  describe('mixed scenarios', () => {
    it('should count individual filters + combined categories + period correctly', () => {
      const filters: Partial<FormFilters> = {
        // Individual filters
        noPilote: true,
        restreint: true,
        ficheIds: [1, 2],

        // Combined categories
        utilisateurPiloteIds: ['user1'],
        personnePiloteIds: [1],
        utilisateurReferentIds: ['user2'],

        // Period filter
        typePeriode: 'creation',
        debutPeriode: '2024-01-01T00:00:00Z',
      };

      // 3 individual + 2 combined categories + 1 period = 6
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(6);
    });

    it('should handle complex mixed scenario with invalid period', () => {
      const filters: Partial<FormFilters> = {
        // Individual filters
        ameliorationContinue: true,
        restreint: true,
        noStatut: true,
        // Combined categories
        utilisateurPiloteIds: ['user1'],
        personneReferenteIds: [1, 2],

        // Invalid period (only typePeriode)
        typePeriode: 'modification',
      };

      // 3 individual + 2 combined categories = 5 (type period does not count here since it's alone)
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(5);
    });

    it('should handle empty arrays in combined filters', () => {
      const filters: Partial<FormFilters> = {
        // Individual filters
        noPilote: true,

        // Combined categories with empty arrays
        utilisateurPiloteIds: [],
        personnePiloteIds: [1, 2],
        utilisateurReferentIds: [],
        personneReferenteIds: [],

        // Period filter
        typePeriode: 'debut',
        finPeriode: '2024-12-31T23:59:59Z',
      };

      // 1 individual + 1 combined category (pilotes) + 1 period = 3
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle filters with only undefined values', () => {
      const filters: Partial<FormFilters> = {
        noPilote: undefined,
        ficheIds: undefined,
        typePeriode: undefined,
        debutPeriode: undefined,
        finPeriode: undefined,
      };
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(0);
    });

    it('should handle filters with only null values', () => {
      const filters: Partial<FormFilters> = {
        noPilote: null as any,
        ficheIds: null as any,
        typePeriode: null as any,
        debutPeriode: null as any,
        finPeriode: null as any,
      };
      expect(countActiveFicheFilters(filters as FormFilters)).toBe(0);
    });

    it('should handle filters with only empty arrays', () => {
      const filters: FormFilters = {
        ficheIds: [],
        thematiqueIds: [],
        utilisateurPiloteIds: [],
        personnePiloteIds: [],
      } as unknown as FormFilters;
      expect(countActiveFicheFilters(filters)).toBe(0);
    });

    it('should handle mixed undefined, null, and empty values', () => {
      const filters: FormFilters = {
        noPilote: true,
        hasBudgetPrevisionnel: undefined,
        ficheIds: [],
        typePeriode: null as any,
        debutPeriode: '2024-01-01T00:00:00Z',
        finPeriode: undefined,
      } as unknown as FormFilters;

      // 1 individual (noPilote) // debutPeriode is not counted since it's alone
      expect(countActiveFicheFilters(filters)).toBe(1);
    });
  });
});
