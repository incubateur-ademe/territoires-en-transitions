import { EditableSection } from '../components/EditableSection';
import { FinanceursTable } from './financeurs-table';

export const FinanceursView = () => {
  return (
    <EditableSection label="Financeurs :">
      <FinanceursTable />
    </EditableSection>
  );
};
