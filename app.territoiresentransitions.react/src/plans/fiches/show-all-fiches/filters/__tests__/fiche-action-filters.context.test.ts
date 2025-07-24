import { deleteFilterValueForSingleKey } from '../fiche-action-filters-context';
import { WITH, WITHOUT } from '../options';
import { FilterKeys, FormFilters } from '../types';
import { LookupConfig } from '../use-fiche-action-filters-data';

describe('deleteFilterValueForSingleKey', () => {
  // Mock data for testing
  const mockFormFilters: FormFilters = {
    noPlan: true,
    statuts: ['En cours', 'Réalisé', 'En retard'],
    priorites: ['Élevé', 'Moyen'],
    thematiqueIds: [1, 2, 3],
    planActionIds: [10, 20],
    hasIndicateurLies: WITH,
    hasNoteDeSuivi: WITHOUT,
    hasMesuresLiees: WITH,
    hasDateDeFinPrevisionnelle: WITHOUT,
  };

  const mockLookupConfig: Partial<Record<FilterKeys, LookupConfig>> = {
    thematiqueIds: {
      items: [
        { id: 1, nom: 'Environnement' },
        { id: 2, nom: 'Transport' },
        { id: 3, nom: 'Énergie' },
      ],
      key: 'id',
      valueKey: 'nom',
    },
    planActionIds: {
      items: [
        { id: 10, nom: 'Plan Climat' },
        { id: 20, nom: 'Plan Mobilité' },
      ],
      key: 'id',
      valueKey: 'nom',
      fallbackLabel: 'Plan sans titre',
    },
  };

  describe('when config is undefined (no lookup configuration)', () => {
    it('should remove a value from an array field and return updated filters', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'En cours',
        formFilters: mockFormFilters,
        config: undefined,
      });

      expect(result.statuts).toEqual(['Réalisé', 'En retard']);
      expect(result).toEqual({
        ...mockFormFilters,
        statuts: ['Réalisé', 'En retard'],
      });
    });

    it('should remove a value from an array field with numbers and return updated filters', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'thematiqueIds',
        valueToDelete: '2',
        formFilters: mockFormFilters,
        config: undefined,
      });

      expect(result.thematiqueIds).toEqual(['1', '3']);
      expect(result).toEqual({
        ...mockFormFilters,
        thematiqueIds: ['1', '3'],
      });
    });

    it('should set field to undefined when removing the last value from an array', () => {
      const filtersWithSingleValue: FormFilters = {
        ...mockFormFilters,
        statuts: ['En cours'],
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'En cours',
        formFilters: filtersWithSingleValue,
        config: undefined,
      });

      expect(result.statuts).toBeUndefined();
      expect(result).toEqual({
        ...filtersWithSingleValue,
        statuts: undefined,
      });
    });

    it('should handle non-array fields by setting them to undefined', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'hasIndicateurLies',
        valueToDelete: WITH,
        formFilters: mockFormFilters,
        config: undefined,
      });

      expect(result.hasIndicateurLies).toBeUndefined();
      expect(result).toEqual({
        ...mockFormFilters,
        hasIndicateurLies: undefined,
      });
    });
  });
  describe('when config is provided (with lookup configuration)', () => {
    it('should remove a value using lookup configuration and return updated filters', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'thematiqueIds',
        valueToDelete: 'Transport', // Using the display name
        formFilters: mockFormFilters,
        config: mockLookupConfig.thematiqueIds,
      });

      // Should remove the ID corresponding to 'Transport' (id: 2)
      expect(result.thematiqueIds).toEqual([1, 3]);
      expect(result).toEqual({
        ...mockFormFilters,
        thematiqueIds: [1, 3],
      });
    });

    it('should handle lookup with fallback label when item is not found', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'planActionIds',
        valueToDelete: 'Plan inexistant',
        formFilters: mockFormFilters,
        config: mockLookupConfig.planActionIds,
      });

      // Should use fallback label since item is not found
      expect(result.planActionIds).toEqual([10, 20]);
    });

    it('should handle lookup when item is found and remove the corresponding ID', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'planActionIds',
        valueToDelete: 'Plan Climat',
        formFilters: mockFormFilters,
        config: mockLookupConfig.planActionIds,
      });

      // Should remove the ID corresponding to 'Plan Climat' (id: 10)
      expect(result.planActionIds).toEqual([20]);
    });

    it('should set field to undefined when removing the last value with lookup', () => {
      const filtersWithSingleValue: FormFilters = {
        ...mockFormFilters,
        thematiqueIds: [1],
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'thematiqueIds',
        valueToDelete: 'Environnement',
        formFilters: filtersWithSingleValue,
        config: mockLookupConfig.thematiqueIds,
      });

      expect(result.thematiqueIds).toBeUndefined();
    });

    it('should handle case where items array is undefined in config', () => {
      const configWithUndefinedItems: LookupConfig = {
        items: undefined,
        key: 'id',
        valueKey: 'nom',
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'thematiqueIds',
        valueToDelete: 'Transport',
        formFilters: mockFormFilters,
        config: configWithUndefinedItems,
      });

      // Should fall back to direct value comparison
      expect(result.thematiqueIds).toEqual([1, 2, 3]);
    });

    it('should handle case where item is not found in lookup items', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'thematiqueIds',
        valueToDelete: 'Thématique inexistante',
        formFilters: mockFormFilters,
        config: mockLookupConfig.thematiqueIds,
      });

      // Should use the original valueToDelete since item is not found
      expect(result.thematiqueIds).toEqual([1, 2, 3]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty array values', () => {
      const filtersWithEmptyArray: FormFilters = {
        ...mockFormFilters,
        statuts: [],
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'En cours',
        formFilters: filtersWithEmptyArray,
        config: undefined,
      });

      expect(result.statuts).toBeUndefined();
    });

    it('should handle undefined field values', () => {
      const filtersWithUndefinedField: FormFilters = {
        ...mockFormFilters,
        statuts: undefined,
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'En cours',
        formFilters: filtersWithUndefinedField,
        config: undefined,
      });

      expect(result.statuts).toBeUndefined();
    });

    it('should handle null field values', () => {
      const filtersWithNullField: FormFilters = {
        ...mockFormFilters,
        statuts: null as any,
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'En cours',
        formFilters: filtersWithNullField,
        config: undefined,
      });

      expect(result.statuts).toBeUndefined();
    });

    it('should handle mixed array types (strings and numbers)', () => {
      const filtersWithMixedTypes: FormFilters = {
        ...mockFormFilters,
        thematiqueIds: [1, '2', 3] as any,
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'thematiqueIds',
        valueToDelete: '2',
        formFilters: filtersWithMixedTypes,
        config: undefined,
      });

      expect(result.thematiqueIds).toEqual(['1', '3']);
    });

    it('should preserve other fields when modifying one field', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'En cours',
        formFilters: mockFormFilters,
        config: undefined,
      });

      // Check that other fields remain unchanged
      expect(result.noPlan).toBe(mockFormFilters.noPlan);
      expect(result.priorites).toEqual(mockFormFilters.priorites);
      expect(result.thematiqueIds).toEqual(mockFormFilters.thematiqueIds);
      expect(result.planActionIds).toEqual(mockFormFilters.planActionIds);
      expect(result.hasIndicateurLies).toBe(mockFormFilters.hasIndicateurLies);
    });

    it('should handle boolean fields correctly', () => {
      const filtersWithBoolean: FormFilters = {
        ...mockFormFilters,
        noPlan: true,
      };

      const result = deleteFilterValueForSingleKey({
        categoryKey: 'noPlan',
        valueToDelete: 'true',
        formFilters: filtersWithBoolean,
        config: undefined,
      });

      expect(result.noPlan).toBeUndefined();
    });
  });

  describe('type safety and immutability', () => {
    it('should not mutate the original formFilters object', () => {
      const originalFilters = { ...mockFormFilters };

      deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'en_cours',
        formFilters: mockFormFilters,
        config: undefined,
      });

      expect(mockFormFilters).toEqual(originalFilters);
    });

    it('should return a new object with the same structure', () => {
      const result = deleteFilterValueForSingleKey({
        categoryKey: 'statuts',
        valueToDelete: 'en_cours',
        formFilters: mockFormFilters,
        config: undefined,
      });

      expect(result).not.toBe(mockFormFilters);
      expect(typeof result).toBe('object');
      expect(Array.isArray(result.statuts)).toBe(true);
    });
  });
});
