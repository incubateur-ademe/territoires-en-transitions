import { sumRoundedTo } from '@tet/domain/utils';
import { BudgetPerYear } from '../../../../context/types';

export type BudgetTotals = {
  montant: number;
  depense: number;
  etpPrevisionnel: number;
  etpReel: number;
};

const sumField = (
  budgets: BudgetPerYear[],
  field: keyof BudgetTotals
): number => sumRoundedTo(budgets.map((budget) => budget[field]));

export const computeBudgetTotals = (
  budgets: BudgetPerYear[]
): BudgetTotals => ({
  montant: sumField(budgets, 'montant'),
  depense: sumField(budgets, 'depense'),
  etpPrevisionnel: sumField(budgets, 'etpPrevisionnel'),
  etpReel: sumField(budgets, 'etpReel'),
});
