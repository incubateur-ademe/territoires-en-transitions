import { FicheActionBudget } from '@tet/domain/plans';
import type { BudgetProperties } from './types';

export const toBudgetProperties = (
  budgets: Array<FicheActionBudget>,
  type: 'investissement' | 'fonctionnement'
): Array<BudgetProperties> => {
  return budgets
    .filter((b) => b.type === type)
    .map((b) => ({
      value:
        b.budgetPrevisionnel || b.budgetReel
          ? {
              previsionnel: b.budgetPrevisionnel ?? null,
              reel: b.budgetReel ?? null,
            }
          : null,
      unit: b.unite,
      isExtended: b.estEtale ?? false,
      year: b.annee ?? null,
    }))
    .filter((b): b is BudgetProperties => !!b.value);
};
