import { BudgetType } from '@tet/domain/plans';
import { useOpenState } from '@tet/ui/hooks/use-open-state';
import { isNil } from 'es-toolkit';
import React, { useMemo, useState } from 'react';
import { useFicheContext } from '../../../context/fiche-context';
import { EditableSection } from '../components/EditableSection';
import { BudgetTypeChangeModal } from './budget-type-change.modal';
import { BudgetPerYearTable } from './per-year-table';
import { BudgetSummaryTable } from './summary-table';

function getSectionLabel(type: BudgetType) {
  const labels = {
    investissement: "d'investissement",
    fonctionnement: 'de fonctionnement',
  };
  return `Budget ${labels[type]} : `;
}

export const BudgetView = ({ type }: { type: BudgetType }) => {
  const { budgets: budgetsState } = useFicheContext();

  const { perYear, summary } = budgetsState[type];

  const hasPerYearBudgets = perYear.length > 0;
  const hasSummaryBudgets =
    summary !== null &&
    Object.values(summary).some((value) => isNil(value) === false);

  const defaultView = useMemo(
    () => (budgetsState[type].perYear.length > 0 ? 'year' : 'summary'),
    [budgetsState, type]
  );

  const [view, setView] = useState<'year' | 'summary'>('summary');

  React.useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  const modalOpenState = useOpenState();

  const handleToggleChange = () => {
    const needUserConfirmationToDeleteDataAndSwitchView =
      (view === 'year' && hasPerYearBudgets !== false) ||
      (view === 'summary' && hasSummaryBudgets !== false);

    if (needUserConfirmationToDeleteDataAndSwitchView === false) {
      return switchView();
    }
    modalOpenState.setIsOpen(needUserConfirmationToDeleteDataAndSwitchView);
  };

  const switchView = async () => {
    await budgetsState.reset(type, view);
    setView(view === 'year' ? 'summary' : 'year');
    modalOpenState.setIsOpen(false);
  };

  const handleCancel = () => {
    modalOpenState.setIsOpen(false);
  };

  return (
    <>
      <EditableSection
        label={getSectionLabel(type)}
        toggleChecked={view === 'year'}
        onToggleChange={handleToggleChange}
      >
        {view === 'year' ? (
          <BudgetPerYearTable type={type} />
        ) : (
          <BudgetSummaryTable type={type} />
        )}
      </EditableSection>
      <BudgetTypeChangeModal
        isOpen={modalOpenState.isOpen}
        setIsOpen={modalOpenState.setIsOpen}
        currentView={view}
        onValidate={switchView}
        onCancel={handleCancel}
      />
    </>
  );
};
