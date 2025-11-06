import { FicheActionBudget, FicheWithRelations } from '@/domain/plans';
import { isAfter } from 'date-fns';
import { toBudgetProperties } from './to-budget-properties';

const DATE_OF_THE_UNIT_SWITCH = new Date('2025-05-13');

export const shouldDisplayUnitWarning = (
  fiche: FicheWithRelations,
  budgets: FicheActionBudget[]
) => {
  const isFicheTooRecent = isAfter(
    new Date(fiche.createdAt),
    DATE_OF_THE_UNIT_SWITCH
  );

  if (isFicheTooRecent) {
    return false;
  }

  const investmentBudgetsToConsider = toBudgetProperties(
    budgets,
    'investissement'
  );
  const fonctionnementBudgetsToConsider = toBudgetProperties(
    budgets,
    'fonctionnement'
  );

  const atLeastOneBudgetInformationIsFilled =
    investmentBudgetsToConsider?.some((budget) => !!budget.value) ||
    fonctionnementBudgetsToConsider?.some((budget) => !!budget.value);

  return atLeastOneBudgetInformationIsFilled;
};
