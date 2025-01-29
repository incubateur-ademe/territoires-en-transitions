import { useEffect, useMemo, useRef } from 'react';
import {
  CellProps,
  Column,
  HeaderProps,
  useExpanded,
  useFlexLayout,
  useTable,
} from 'react-table';
import { CellAuditStatut, CellCheckmark } from './Cells';
import { FiltreAuditStatut } from './FiltreAuditStatut';
import { FiltreOrdreDuJour } from './FiltreOrdreDuJour';
import { TAuditSuiviRow } from './queries';
import { TableData } from './useTableData';
import { CellAction } from '../../ReferentielTable/CellAction';
import { ReferentielTable } from '../../ReferentielTable';

export type TAuditSuiviTableProps = {
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
    Cell: CellAction as any, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: 'ordre_du_jour',
    Header: FiltreOrdreDuJour as any,
    Cell: CellCheckmark,
    width: 180,
  },
  {
    accessor: 'statut',
    Header: FiltreAuditStatut as any,
    Cell: CellAuditStatut,
    width: 165,
  },
];

/**
 * Affiche la table "Suivi de l'audit"
 */
export const Table = (props: TAuditSuiviTableProps) => {
  const { tableData } = props;
  const { table, isLoading, filters, setFilters } = tableData;

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  const customHeaderProps = useMemo(() => ({ filters, setFilters }), [filters]);

  // crée l'instance de la table
  const tableInstance = useTable(
    { ...table, columns: COLUMNS },
    useExpanded,
    useFlexLayout
  );
  const { toggleAllRowsExpanded } = tableInstance;

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
      dataTest="suivi-audit"
      className="no-d3-border-top"
      isLoading={isLoading}
      table={tableInstance}
      customHeaderProps={customHeaderProps}
    />
  );
};
