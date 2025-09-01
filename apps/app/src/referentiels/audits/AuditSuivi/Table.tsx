import { useEffect, useMemo } from 'react';
import {
  CellProps,
  Column,
  HeaderProps,
  useExpanded,
  useFlexLayout,
  useTable,
} from 'react-table';
import { ReferentielTable } from '../../ReferentielTable';
import { CellAction } from '../../ReferentielTable/CellAction';
import { CellAuditStatut, CellCheckmark } from './Cells';
import { FiltreAuditStatut } from './FiltreAuditStatut';
import { FiltreOrdreDuJour } from './FiltreOrdreDuJour';
import { TAuditSuiviRow } from './queries';
import { MesureAuditStatut, TableData } from './useTableData';

export type TAuditSuiviTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<TAuditSuiviRow> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<TAuditSuiviRow>;
export type TColumn = Column<MesureAuditStatut>;

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'mesureNom', // la clé pour accéder à la valeur
    Header: 'Sous-actions', // rendu dans la ligne d'en-tête
    Cell: CellAction as any, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: 'ordreDuJour',
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
  useEffect(() => {
    if (table.data.length) {
      toggleAllRowsExpanded(true);
    }
  }, [table.data.length, toggleAllRowsExpanded]);

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
