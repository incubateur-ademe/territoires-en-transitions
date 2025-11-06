import { Alert } from '@/ui';

import { FicheActionBudget, FicheWithRelations } from '@/domain/plans';
import { isAfter } from 'date-fns';
import { toBudgetProperties } from './to-budget-properties';

const DATE_OF_THE_UNIT_SWITCH = new Date('2025-13-05');

export const shouldDisplayUnitWarning = (
  fiche: FicheWithRelations,
  budgets: FicheActionBudget[]
) => {
  if (isAfter(new Date(fiche.createdAt), DATE_OF_THE_UNIT_SWITCH)) {
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
  return (
    investmentBudgetsToConsider?.some((budget) => !!budget.value) ||
    fonctionnementBudgetsToConsider?.some((budget) => !!budget.value)
  );
};

export const BudgetUnitWarning = ({
  fiche,
  budgets,
}: {
  fiche: FicheWithRelations;
  budgets: FicheActionBudget[];
}) => {
  const shouldDisplay = shouldDisplayUnitWarning(fiche, budgets);
  if (!shouldDisplay) {
    return null;
  }
  return (
    <Alert
      state="warning"
      title="Ce champ historiquement en TTC est passé en HT, veillez à vérifier vos valeurs et à les modifier le cas échéant. N’hésitez pas à contacter le support si vous avez besoin d’aide pour faire les conversions."
      rounded
      withBorder
      className="mb-8"
    />
  );
};
