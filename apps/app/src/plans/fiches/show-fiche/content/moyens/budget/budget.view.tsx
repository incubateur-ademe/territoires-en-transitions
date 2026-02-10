import { BudgetType } from '@tet/domain/plans';
import { useOpenState } from '@tet/ui/hooks/use-open-state';
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
    modalOpenState.setIsOpen(true);
  };

  const handleValidate = async () => {
    const newView = view === 'year' ? 'summary' : 'year';
    await budgetsState.reset(type, view);
    setView(newView);
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
        onValidate={handleValidate}
        onCancel={handleCancel}
      />
    </>
  );
};
