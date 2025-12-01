import { FicheActionBudget, FicheWithRelations } from '@/domain/plans';
import { isAfter } from 'date-fns';
import { toBudgetProperties } from './to-budget-properties';

const DATE_OF_THE_UNIT_SWITCH = new Date('2025-05-13');

const isFicheTooRecent = (fiche: FicheWithRelations) => {
  return isAfter(new Date(fiche.createdAt), DATE_OF_THE_UNIT_SWITCH);
};
export const shouldDisplayBudgetUnitWarning = (
  fiche: FicheWithRelations,
  budgets: FicheActionBudget[]
) => {
  if (isFicheTooRecent(fiche)) {
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

export const shouldDisplayFinanceursUnitWarning = (
  fiche: FicheWithRelations
) => {
  if (isFicheTooRecent(fiche)) {
    return false;
  }
  const hasFinanceurInformation =
    !!fiche.financeurs && fiche.financeurs.length > 0;
  return hasFinanceurInformation;
};
