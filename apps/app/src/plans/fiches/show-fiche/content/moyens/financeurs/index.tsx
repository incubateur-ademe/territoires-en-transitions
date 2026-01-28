import { useState } from 'react';
import { useFicheContext } from '../../../context/fiche-context';
import { EditableSection } from '../components/EditableSection';
import { EmptyTableView } from '../empty-view';
import { FinanceursTable } from './financeurs-table';

export const FinanceursView = () => {
  const [isAddingFinanceur, setIsAddingFinanceur] = useState(false);
  const { financeurs: financeursState } = useFicheContext();
  const showEmptyCard =
    (!financeursState.list || financeursState.list?.length === 0) &&
    isAddingFinanceur === false;

  if (showEmptyCard) {
    return (
      <EmptyTableView
        type="financeurs"
        onClick={() => setIsAddingFinanceur(true)}
      />
    );
  }
  return (
    <EditableSection label="Financeurs :">
      <FinanceursTable />
    </EditableSection>
  );
};
