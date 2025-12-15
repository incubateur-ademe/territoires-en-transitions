import {
  BudgetType,
  BudgetUnite,
} from '../../fiches/fiche-action-budget/budget.types';

export type ComputeBudgetOutput = {
  [key in BudgetType]: {
    [key in BudgetUnite]: {
      budgetPrevisionnel: number;
      budgetReel: number;
    };
  };
};
