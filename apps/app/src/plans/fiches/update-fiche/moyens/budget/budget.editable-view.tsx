import { FicheActionBudget } from '@tet/domain/plans';
import { EditableSection } from '../components/EditableSection';
import { BudgetInvestissementContent } from './budget-investissement.content';
import { BudgetPerYearContent } from './budget-per-year.content';
import { toBudgetProperties } from './to-budget-properties';
import { PerYearBudgetProperties } from './types';

function getSectionLabel(type: BudgetType) {
  const labels = {
    investissement: 'd’investissement',
    fonctionnement: 'de fonctionnement',
  };
  return `Budget ${labels[type]} : `;
}

type BudgetType = 'investissement' | 'fonctionnement';
type BudgetEditableViewProps = {
  type: BudgetType;
  isReadonly?: boolean;
  budgets: FicheActionBudget[];
  onEdit: () => void;
};

export const BudgetEditableView = (props: BudgetEditableViewProps) => {
  const { type, isReadonly, budgets, onEdit } = props;

  const budgetsToConsider = toBudgetProperties(budgets, type);
  const hasBudgets = budgetsToConsider.length > 0;
  const perYearBudgets = budgetsToConsider.filter(
    (b): b is PerYearBudgetProperties => !!b.year
  );

  const perYearView = perYearBudgets.length > 0;
  return (
    <EditableSection
      label={getSectionLabel(type)}
      isReadonly={isReadonly}
      hasContent={hasBudgets}
      onEdit={onEdit}
      editButtonTitle="Modifier le budget"
    >
      {perYearView ? (
        <BudgetPerYearContent budgets={perYearBudgets} />
      ) : (
        <BudgetInvestissementContent budgets={budgetsToConsider} />
      )}
    </EditableSection>
  );
};
