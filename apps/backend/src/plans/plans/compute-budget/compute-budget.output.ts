import { BudgetType, BudgetUnite } from '@tet/domain/plans';

type BudgetTypeWithTotal = BudgetType | 'total';

export type ComputeBudgetOutput = {
  [key in BudgetTypeWithTotal]: {
    [key in BudgetUnite]: {
      budgetPrevisionnel: number;
      budgetReel: number;
    };
  };
};
