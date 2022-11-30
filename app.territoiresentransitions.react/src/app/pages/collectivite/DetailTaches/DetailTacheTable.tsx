import {useEffect, useMemo, useRef} from 'react';
import {
  Column,
  CellProps,
  HeaderProps,
  useTable,
  useExpanded,
  useFlexLayout,
} from 'react-table';
import {TacheDetail} from './queries';
import {TableData} from './useTableData';
import ReferentielTable from '../ReferentielTable';
import {CellAction} from '../ReferentielTable/CellAction';
import {CellStatut} from './CellStatut';
import {FiltreStatut} from './FiltreStatut';

export type TDetailTacheTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<TacheDetail> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<TacheDetail>;
export type TColumn = Column<TacheDetail>;

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Tâches', // rendu dans la ligne d'en-tête
    Cell: CellAction, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: 'avancement',
    Header: FiltreStatut,
    Cell: CellStatut,
    width: 185,
  },
];

/**
 * Affiche la table "Détail des tâches"
 */
export const DetailTacheTable = (props: TDetailTacheTableProps) => {
  const {tableData} = props;
  const {table, isLoading, isSaving, filters, setFilters, updateStatut} =
    tableData;

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  const customCellProps = useMemo(() => ({updateStatut, isSaving}), [isSaving]);
  const customHeaderProps = useMemo(() => ({filters, setFilters}), [filters]);

  // crée l'instance de la table
  const tableInstance = useTable(
    {...table, columns: COLUMNS},
    useExpanded,
    useFlexLayout
  );
  const {toggleAllRowsExpanded} = tableInstance;

  // initialement tout est déplié
  const isInitialLoading = useRef(true);
  useEffect(() => {
    if (table?.data?.length && isInitialLoading.current) {
      isInitialLoading.current = false;
      toggleAllRowsExpanded(true);
    }
  }, [table?.data?.length, toggleAllRowsExpanded, isInitialLoading]);

  // rendu de la table
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
