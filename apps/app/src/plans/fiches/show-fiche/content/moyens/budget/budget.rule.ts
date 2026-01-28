import { isNil } from 'es-toolkit';
import { Budget, BudgetPerYear } from '../../../context/types';

export const isSummaryEmpty = (summaryBudget: Budget) => {
  if (summaryBudget === null) {
    return true;
  }
  return (
    isNil(summaryBudget.montant) &&
    isNil(summaryBudget.depense) &&
    isNil(summaryBudget.etpPrevisionnel) &&
    isNil(summaryBudget.etpReel)
  );
};

export const isPerYearEmpty = (perYearBudgets: BudgetPerYear[]) => {
  if (perYearBudgets === null || perYearBudgets.length === 0) {
    return true;
  }
  return (
    perYearBudgets.filter((perYearBudget) => !isSummaryEmpty(perYearBudget))
      .length === 0
  );
};
