import {useEffect, useMemo, useRef} from 'react';
import {
  Column,
  CellProps,
  HeaderProps,
  useTable,
  useExpanded,
  useFlexLayout,
} from 'react-table';
import {TableData} from './useTableData';
import {CellAction} from '../ReferentielTable/CellAction';
import ReferentielTable from '../ReferentielTable';
import {CellAuditStatut, CellCheckmark} from './Cells';
import {FiltreOrdreDuJour} from './FiltreOrdreDuJour';
import {FiltreAuditStatut} from './FiltreAuditStatut';
import {TAuditSuiviRow} from './queries';

export type TDetailTacheTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<TAuditSuiviRow> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<TAuditSuiviRow>;
export type TColumn = Column<TAuditSuiviRow>;

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Sous-actions', // rendu dans la ligne d'en-tête
    Cell: CellAction, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: 'ordre_du_jour',
    Header: FiltreOrdreDuJour,
    Cell: CellCheckmark,
    width: 180,
  },
  {
    accessor: 'statut',
    Header: FiltreAuditStatut,
    Cell: CellAuditStatut,
    width: 165,
  },
];

/**
 * Affiche la table "Suivi de l'audit"
 */
export const Table = (props: TDetailTacheTableProps) => {
  const {tableData} = props;
  const {table, isLoading, filters, setFilters} = tableData;

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
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
      className="no-d3-border-top"
      isLoading={isLoading}
      table={tableInstance}
      customHeaderProps={customHeaderProps}
    />
  );
};
