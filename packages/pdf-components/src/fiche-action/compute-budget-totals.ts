import { sumRoundedTo } from '@tet/domain/utils';

export type BudgetRow = {
  eurosPrevisionnel: number | undefined | null;
  eurosReel: number | undefined | null;
  etpPrevisionnel: number | undefined | null;
  etpReel: number | undefined | null;
};

export type BudgetTotals = Record<keyof BudgetRow, number>;

const sumField = (budgets: BudgetRow[], field: keyof BudgetRow): number =>
  sumRoundedTo(budgets.map((budget) => budget[field]));

export const computeBudgetTotals = (budgets: BudgetRow[]): BudgetTotals => ({
  eurosPrevisionnel: sumField(budgets, 'eurosPrevisionnel'),
  eurosReel: sumField(budgets, 'eurosReel'),
  etpPrevisionnel: sumField(budgets, 'etpPrevisionnel'),
  etpReel: sumField(budgets, 'etpReel'),
});
