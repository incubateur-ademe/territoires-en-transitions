import { FicheBudget, FicheBudgetCreate } from '@tet/domain/plans';
import { isNil } from 'es-toolkit';
import { Budget, BudgetPerYear } from './types';

export const transformFicheBudgetsToBudgetPerYear = (
  budgets: FicheBudget[],
  type: 'investissement' | 'fonctionnement'
): BudgetPerYear[] => {
  const rawBudgetsByYear = budgets
    .filter(
      (budget): budget is FicheBudget & { annee: number } =>
        budget.annee !== null && budget.type === type
    )
    .reduce((acc, budget) => {
      const year = budget.annee;
      const existing = acc[year] ?? {};

      return {
        ...acc,
        [year]: {
          ...existing,
          ...(budget.unite === 'HT' && { ht: budget }),
          ...(budget.unite === 'ETP' && { etp: budget }),
        },
      };
    }, {} as Record<number, { ht?: FicheBudget; etp?: FicheBudget }>);

  const budgetsPerYear = Object.entries(rawBudgetsByYear)
    .map(([year, data]) => ({
      year: Number(year),
      montant: data.ht?.budgetPrevisionnel ?? undefined,
      depense: data.ht?.budgetReel ?? undefined,
      etpPrevisionnel: data.etp?.budgetPrevisionnel ?? undefined,
      etpReel: data.etp?.budgetReel ?? undefined,
      htBudgetId: data.ht?.id,
      etpBudgetId: data.etp?.id,
    }))
    .sort((a, b) => a.year - b.year);
  return budgetsPerYear;
};

export const transformFicheBudgetsToBudgetSummary = (
  budgets: FicheBudget[],
  type: 'investissement' | 'fonctionnement'
): Budget | null => {
  const budgetsByType = budgets.filter(
    (budget) => budget.type === type && budget.annee === null
  );
  if (budgetsByType.length === 0) {
    return null;
  }
  const etp = budgetsByType.find((budget) => budget.unite === 'ETP');
  const ht = budgetsByType.find((budget) => budget.unite === 'HT');
  if (!ht && !etp) {
    return null;
  }
  return {
    montant: ht?.budgetPrevisionnel ?? undefined,
    depense: ht?.budgetReel ?? undefined,
    etpPrevisionnel: etp?.budgetPrevisionnel ?? undefined,
    etpReel: etp?.budgetReel ?? undefined,
    htBudgetId: ht?.id,
    etpBudgetId: etp?.id,
  };
};

export const transformBudgetToFicheBudgetCreate = (
  budget: BudgetPerYear | Budget,
  ficheId: number,
  type: 'investissement' | 'fonctionnement'
): FicheBudgetCreate[] => {
  const htBudget: FicheBudgetCreate = {
    ficheId,
    type,
    budgetPrevisionnel: budget.montant,
    budgetReel: budget.depense,
    estEtale: undefined,
    unite: 'HT',
    annee: 'year' in budget ? budget.year : null,
    id: budget.htBudgetId,
  };
  const etpBudget: FicheBudgetCreate = {
    ficheId,
    type,
    budgetPrevisionnel: budget.etpPrevisionnel,
    budgetReel: budget.etpReel,
    estEtale: undefined,
    unite: 'ETP',
    annee: 'year' in budget ? budget.year : null,
    id: budget.etpBudgetId,
  };
  return [htBudget, etpBudget].filter(
    (budget) => !isNil(budget.budgetPrevisionnel) || !isNil(budget.budgetReel)
  );
};
