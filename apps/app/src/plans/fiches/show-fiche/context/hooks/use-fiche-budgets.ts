import { FicheWithRelations } from '@tet/domain/plans';
import { useCallback, useMemo } from 'react';
import { useDeleteBudgets } from '../../../update-fiche/data/use-delete-budgets';
import { useGetBudget } from '../../../update-fiche/data/use-get-budget';
import { useUpsertBudgets } from '../../../update-fiche/data/use-upsert-budgets';
import {
  transformBudgetToFicheBudgetCreate,
  transformFicheBudgetsToBudgetPerYear,
  transformFicheBudgetsToBudgetSummary,
} from '../budget-utils';
import { Budget, BudgetPerYear, BudgetsState } from '../types';

export const useFicheBudgets = (fiche: FicheWithRelations): BudgetsState => {
  const { data: budgets = [], isLoading } = useGetBudget({
    ficheId: fiche.id,
  });
  const upsertBudgetsMutation = useUpsertBudgets();
  const deleteBudgetsMutation = useDeleteBudgets();

  const investissementPerYear = useMemo(
    () => transformFicheBudgetsToBudgetPerYear(budgets, 'investissement'),
    [budgets]
  );
  const investissementSummary = useMemo(
    () => transformFicheBudgetsToBudgetSummary(budgets, 'investissement'),
    [budgets]
  );
  const fonctionnementPerYear = useMemo(
    () => transformFicheBudgetsToBudgetPerYear(budgets, 'fonctionnement'),
    [budgets]
  );
  const fonctionnementSummary = useMemo(
    () => transformFicheBudgetsToBudgetSummary(budgets, 'fonctionnement'),
    [budgets]
  );

  const upsertYear = useCallback(
    async (
      budget: BudgetPerYear,
      type: 'investissement' | 'fonctionnement'
    ) => {
      const existingBudget = fiche.budgets?.find(
        (b) => b.id === budget.etpBudgetId || b.id === budget.htBudgetId
      );
      const isNewBudget = existingBudget === undefined;

      if (isNewBudget) {
        const budgetsToUpsert = transformBudgetToFicheBudgetCreate(
          budget,
          fiche.id,
          type
        );
        await upsertBudgetsMutation.mutateAsync(budgetsToUpsert);
        return;
      }

      const currentPerYear =
        type === 'investissement'
          ? investissementPerYear
          : fonctionnementPerYear;

      const budgetsToUpdate = currentPerYear
        .map((b) => {
          const mustBeSwapped =
            (b.etpBudgetId === budget.etpBudgetId ||
              b.htBudgetId === budget.htBudgetId) &&
            (budget.etpBudgetId !== undefined ||
              budget.htBudgetId !== undefined);

          return mustBeSwapped ? budget : b;
        })
        .flatMap((b) => transformBudgetToFicheBudgetCreate(b, fiche.id, type));

      await upsertBudgetsMutation.mutateAsync(budgetsToUpdate);
    },
    [
      fiche.id,
      fiche.budgets,
      investissementPerYear,
      fonctionnementPerYear,
      upsertBudgetsMutation,
    ]
  );

  const upsertSummary = useCallback(
    async (summary: Budget, type: 'investissement' | 'fonctionnement') => {
      const budgetsToUpsert = transformBudgetToFicheBudgetCreate(
        summary,
        fiche.id,
        type
      );
      await upsertBudgetsMutation.mutateAsync(budgetsToUpsert);
    },
    [fiche.id, upsertBudgetsMutation]
  );

  const deleteBudgets = useCallback(
    async (year: number, type: 'investissement' | 'fonctionnement') => {
      const currentPerYear =
        type === 'investissement'
          ? investissementPerYear
          : fonctionnementPerYear;
      const budgetsToDelete = currentPerYear.find((b) => b.year === year);
      const budgetsIds = [
        budgetsToDelete?.etpBudgetId,
        budgetsToDelete?.htBudgetId,
      ].filter((id): id is number => id !== undefined);

      await deleteBudgetsMutation.mutateAsync({
        ficheId: fiche.id,
        budgetsIds,
      });
    },
    [
      investissementPerYear,
      fonctionnementPerYear,
      fiche.id,
      deleteBudgetsMutation,
    ]
  );

  const reset = useCallback(
    (type: 'investissement' | 'fonctionnement', view: 'year' | 'summary') => {
      const budgetsToReset =
        type === 'investissement'
          ? view === 'year'
            ? investissementPerYear
            : investissementSummary
          : view === 'year'
          ? fonctionnementPerYear
          : fonctionnementSummary;

      const budgetsIds = (
        Array.isArray(budgetsToReset) ? budgetsToReset : [budgetsToReset]
      )
        .map((b) => [b?.etpBudgetId, b?.htBudgetId])
        .flat()
        .filter((id): id is number => id !== undefined);

      return deleteBudgetsMutation.mutateAsync({
        ficheId: fiche.id,
        budgetsIds,
      });
    },
    [
      investissementPerYear,
      investissementSummary,
      fonctionnementPerYear,
      fonctionnementSummary,
      fiche.id,
      deleteBudgetsMutation,
    ]
  );

  return useMemo(
    () => ({
      investissement: {
        perYear: investissementPerYear,
        summary: investissementSummary,
      },
      fonctionnement: {
        perYear: fonctionnementPerYear,
        summary: fonctionnementSummary,
      },
      isLoading,
      upsert: {
        year: upsertYear,
        summary: upsertSummary,
      },
      deleteBudgets,
      reset,
    }),
    [
      investissementPerYear,
      investissementSummary,
      fonctionnementPerYear,
      fonctionnementSummary,
      isLoading,
      upsertYear,
      upsertSummary,
      deleteBudgets,
      reset,
    ]
  );
};
