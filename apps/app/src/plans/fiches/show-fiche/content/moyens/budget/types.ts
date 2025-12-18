export type BudgetProperties = {
  value:
    | { previsionnel: number; reel: number | null }
    | { previsionnel: null; reel: number }
    | null;
  unit: 'HT' | 'ETP';
  isExtended: boolean;
  year: number | null;
};

export type PerYearBudgetProperties = Omit<BudgetProperties, 'year'> & {
  year: number;
};
