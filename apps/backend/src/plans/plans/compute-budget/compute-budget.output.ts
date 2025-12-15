import { BudgetType, BudgetUnite } from '@tet/domain/plans';

export type ComputeBudgetOutput = {
  [key in BudgetType]: {
    [key in BudgetUnite]: {
      budgetPrevisionnel: number;
      budgetReel: number;
    };
  };
};
