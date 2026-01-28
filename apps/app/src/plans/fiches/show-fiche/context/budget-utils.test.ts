import { FicheBudget } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import {
  transformBudgetToFicheBudgetCreate,
  transformFicheBudgetsToBudgetPerYear,
  transformFicheBudgetsToBudgetSummary,
} from './budget-utils';
import { Budget, BudgetPerYear } from './types';

describe('budget-utils', () => {
  describe('transformFicheBudgetsToBudgetPerYear', () => {
    it('should handle all transformation scenarios', () => {
      const allBudgets: FicheBudget[] = [
        // Multiple years with both HT and ETP (should be sorted)
        { id: 1, ficheId: 100, type: 'investissement', unite: 'HT', annee: 2025, budgetPrevisionnel: 60000, budgetReel: null, estEtale: false },
        { id: 2, ficheId: 100, type: 'investissement', unite: 'HT', annee: 2024, budgetPrevisionnel: 50000, budgetReel: 45000, estEtale: false },
        { id: 3, ficheId: 100, type: 'investissement', unite: 'ETP', annee: 2024, budgetPrevisionnel: 2.5, budgetReel: 2.0, estEtale: false },
        // Only HT budget for year 2026
        { id: 4, ficheId: 100, type: 'investissement', unite: 'HT', annee: 2026, budgetPrevisionnel: 70000, budgetReel: null, estEtale: false },
        // Only ETP budget for year 2023
        { id: 5, ficheId: 100, type: 'investissement', unite: 'ETP', annee: 2023, budgetPrevisionnel: 3.0, budgetReel: 2.5, estEtale: false },
        // Null values for year 2027
        { id: 6, ficheId: 100, type: 'investissement', unite: 'HT', annee: 2027, budgetPrevisionnel: null, budgetReel: null, estEtale: false },
        { id: 7, ficheId: 100, type: 'investissement', unite: 'ETP', annee: 2027, budgetPrevisionnel: null, budgetReel: null, estEtale: false },
        // Wrong type (should be filtered out)
        { id: 8, ficheId: 100, type: 'fonctionnement', unite: 'HT', annee: 2024, budgetPrevisionnel: 30000, budgetReel: null, estEtale: false },
        // Null year (should be excluded)
        { id: 9, ficheId: 100, type: 'investissement', unite: 'HT', annee: null, budgetPrevisionnel: 50000, budgetReel: null, estEtale: false },
      ];

      const result = transformFicheBudgetsToBudgetPerYear(allBudgets, 'investissement');

      // Should be sorted by year and filter out null years and wrong types
      expect(result).toEqual([
        { year: 2023, montant: undefined, depense: undefined, etpPrevisionnel: 3.0, etpReel: 2.5, htBudgetId: undefined, etpBudgetId: 5 },
        { year: 2024, montant: 50000, depense: 45000, etpPrevisionnel: 2.5, etpReel: 2.0, htBudgetId: 2, etpBudgetId: 3 },
        { year: 2025, montant: 60000, depense: undefined, etpPrevisionnel: undefined, etpReel: undefined, htBudgetId: 1, etpBudgetId: undefined },
        { year: 2026, montant: 70000, depense: undefined, etpPrevisionnel: undefined, etpReel: undefined, htBudgetId: 4, etpBudgetId: undefined },
        { year: 2027, montant: undefined, depense: undefined, etpPrevisionnel: undefined, etpReel: undefined, htBudgetId: 6, etpBudgetId: 7 },
      ]);

      // Test with fonctionnement type
      const fonctResult = transformFicheBudgetsToBudgetPerYear(allBudgets, 'fonctionnement');
      expect(fonctResult).toEqual([
        { year: 2024, montant: 30000, depense: undefined, etpPrevisionnel: undefined, etpReel: undefined, htBudgetId: 8, etpBudgetId: undefined },
      ]);

      // Test with empty array
      expect(transformFicheBudgetsToBudgetPerYear([], 'investissement')).toEqual([]);
    });
  });

  describe('transformFicheBudgetsToBudgetSummary', () => {
    it('should handle all transformation scenarios', () => {
      const allBudgets: FicheBudget[] = [
        // Both HT and ETP summary (annee: null)
        { id: 1, ficheId: 100, type: 'investissement', unite: 'HT', annee: null, budgetPrevisionnel: 100000, budgetReel: 95000, estEtale: false },
        { id: 2, ficheId: 100, type: 'investissement', unite: 'ETP', annee: null, budgetPrevisionnel: 5.0, budgetReel: 4.5, estEtale: false },
        // Only HT for fonctionnement
        { id: 3, ficheId: 100, type: 'fonctionnement', unite: 'HT', annee: null, budgetPrevisionnel: 50000, budgetReel: null, estEtale: false },
        // Null values for another type
        { id: 4, ficheId: 100, type: 'fonctionnement', unite: 'ETP', annee: null, budgetPrevisionnel: null, budgetReel: null, estEtale: false },
        // Should be excluded (non-null year)
        { id: 5, ficheId: 100, type: 'investissement', unite: 'HT', annee: 2024, budgetPrevisionnel: 50000, budgetReel: null, estEtale: false },
      ];

      // Test investissement summary
      const investResult = transformFicheBudgetsToBudgetSummary(allBudgets, 'investissement');
      expect(investResult).toEqual({
        montant: 100000,
        depense: 95000,
        etpPrevisionnel: 5.0,
        etpReel: 4.5,
        htBudgetId: 1,
        etpBudgetId: 2,
      });

      // Test fonctionnement summary
      const fonctResult = transformFicheBudgetsToBudgetSummary(allBudgets, 'fonctionnement');
      expect(fonctResult).toEqual({
        montant: 50000,
        depense: undefined,
        etpPrevisionnel: undefined,
        etpReel: undefined,
        htBudgetId: 3,
        etpBudgetId: 4,
      });

      // Test with no matching type
      expect(transformFicheBudgetsToBudgetSummary(allBudgets.filter(b => b.type === 'investissement' && b.annee !== null), 'investissement')).toBeNull();

      // Test with empty array
      expect(transformFicheBudgetsToBudgetSummary([], 'investissement')).toBeNull();
    });
  });

  describe('transformBudgetToFicheBudgetCreate', () => {
    it('should handle all transformation scenarios', () => {
      // Test with full BudgetPerYear (both HT and ETP)
      const fullBudget: BudgetPerYear = {
        year: 2024,
        montant: 50000,
        depense: 45000,
        etpPrevisionnel: 2.5,
        etpReel: 2.0,
        htBudgetId: 1,
        etpBudgetId: 2,
      };
      const fullResult = transformBudgetToFicheBudgetCreate(fullBudget, 100, 'investissement');
      expect(fullResult).toHaveLength(2);
      expect(fullResult).toContainEqual({
        ficheId: 100, type: 'investissement', budgetPrevisionnel: 50000, budgetReel: 45000,
        estEtale: undefined, unite: 'HT', annee: 2024, id: 1,
      });
      expect(fullResult).toContainEqual({
        ficheId: 100, type: 'investissement', budgetPrevisionnel: 2.5, budgetReel: 2.0,
        estEtale: undefined, unite: 'ETP', annee: 2024, id: 2,
      });

      // Test with Budget summary (null year)
      const summaryBudget: Budget = { montant: 100000, depense: 95000, etpPrevisionnel: 5.0, etpReel: 4.5, htBudgetId: 3, etpBudgetId: 4 };
      const summaryResult = transformBudgetToFicheBudgetCreate(summaryBudget, 100, 'fonctionnement');
      expect(summaryResult).toHaveLength(2);
      expect(summaryResult.find(b => b.unite === 'HT')?.annee).toBe(null);

      // Test with only HT
      const htOnlyBudget: BudgetPerYear = { year: 2024, montant: 50000, depense: 45000 };
      const htResult = transformBudgetToFicheBudgetCreate(htOnlyBudget, 100, 'investissement');
      expect(htResult).toHaveLength(1);
      expect(htResult[0].unite).toBe('HT');

      // Test with only ETP
      const etpOnlyBudget: BudgetPerYear = { year: 2024, etpPrevisionnel: 3.0, etpReel: 2.5 };
      const etpResult = transformBudgetToFicheBudgetCreate(etpOnlyBudget, 100, 'investissement');
      expect(etpResult).toHaveLength(1);
      expect(etpResult[0].unite).toBe('ETP');

      // Test with only previsionnel values
      const prevBudget: BudgetPerYear = { year: 2024, montant: 50000, etpPrevisionnel: 2.5 };
      const prevResult = transformBudgetToFicheBudgetCreate(prevBudget, 100, 'investissement');
      expect(prevResult).toHaveLength(2);
      expect(prevResult.every(b => b.budgetReel === undefined)).toBe(true);

      // Test with only reel values
      const reelBudget: BudgetPerYear = { year: 2024, depense: 45000, etpReel: 2.0 };
      const reelResult = transformBudgetToFicheBudgetCreate(reelBudget, 100, 'investissement');
      expect(reelResult).toHaveLength(2);
      expect(reelResult.every(b => b.budgetPrevisionnel === undefined)).toBe(true);

      // Test with all undefined values (should return empty array)
      const emptyBudget: BudgetPerYear = { year: 2024 };
      const emptyResult = transformBudgetToFicheBudgetCreate(emptyBudget, 100, 'investissement');
      expect(emptyResult).toEqual([]);

      // Test ID preservation
      const idBudget: BudgetPerYear = { year: 2024, montant: 50000, etpPrevisionnel: 2.5, htBudgetId: 10, etpBudgetId: 20 };
      const idResult = transformBudgetToFicheBudgetCreate(idBudget, 100, 'investissement');
      expect(idResult.find(b => b.unite === 'HT')?.id).toBe(10);
      expect(idResult.find(b => b.unite === 'ETP')?.id).toBe(20);
    });
  });
});
