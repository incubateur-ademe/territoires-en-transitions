import { useMemo } from 'react';
import {
  CellProps,
  Column,
  HeaderProps,
  useExpanded,
  useFlexLayout,
  useTable,
} from 'react-table';
import {
  ActionStatutEditContext,
  useActionStatutEditContext,
} from '../actions/action-statut/use-action-statut';
import { ReferentielTable } from '../DEPRECATED_ReferentielTable';
import { CellAction } from '../DEPRECATED_ReferentielTable/CellAction';
import { CellStatut } from './CellStatut';
import { FiltreStatut } from './FiltreStatut';
import { TableData, TacheDetail } from './useTableData';

export type TDetailTacheTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<TacheDetail> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<TacheDetail> & {
  editContext: ActionStatutEditContext;
};
export type TColumn = Column<TacheDetail>;

const COLUMNS: TColumn[] = [
  {
    accessor: 'nom',
    Header: 'Statuts',
    Cell: CellAction as any,
    width: '100%',
  },
  {
    accessor: 'score.statut' as 'score',
    Header: FiltreStatut as any,
    Cell: CellStatut as any,
    width: 250,
  },
];

/**
 * Affiche la table "Détail des tâches"
 */
export const DetailTacheTable = (props: TDetailTacheTableProps) => {
  const { tableData } = props;
  const { table, isLoading, isSaving, filters, setFilters, updateStatut } =
    tableData;

  const editContext = useActionStatutEditContext();

  const customCellProps = useMemo(
    () => ({ updateStatut, isSaving, editContext }),
    [isSaving, updateStatut, editContext]
  );
  const customHeaderProps = useMemo(
    () => ({ filters, setFilters }),
    [filters, setFilters]
  );

  const tableInstance = useTable(
    { ...table, columns: COLUMNS },
    useExpanded,
    useFlexLayout
  );

  return (
    <ReferentielTable
      dataTest="DetailTacheTable"
      isLoading={isLoading}
      table={tableInstance}
      customCellProps={customCellProps}
      customHeaderProps={customHeaderProps}
    />
  );
};
