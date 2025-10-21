import { useEffect, useMemo } from 'react';
import {
  CellProps,
  Column,
  HeaderProps,
  useExpanded,
  useFlexLayout,
  useTable,
} from 'react-table';
import { ReferentielTable } from '../ReferentielTable';
import { CellAction } from '../ReferentielTable/CellAction';
import { CellStatut } from './CellStatut';
import { FiltreStatut } from './FiltreStatut';
import { TableData, TacheDetail } from './useTableData';

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
    Header: 'Statuts', // rendu dans la ligne d'en-tête
    Cell: CellAction as any, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: 'avancement',
    Header: FiltreStatut as any,
    Cell: CellStatut,
    width: 185,
  },
];

/**
 * Affiche la table "Détail des tâches"
 */
export const DetailTacheTable = (props: TDetailTacheTableProps) => {
  const { tableData } = props;
  const { table, isLoading, isSaving, filters, setFilters, updateStatut } =
    tableData;

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  const customCellProps = useMemo(
    () => ({ updateStatut, isSaving }),
    [isSaving, updateStatut]
  );
  const customHeaderProps = useMemo(() => ({ filters, setFilters }), [filters]);

  // crée l'instance de la table
  const tableInstance = useTable(
    { ...table, columns: COLUMNS },
    useExpanded,
    useFlexLayout
  );
  const { toggleAllRowsExpanded, toggleRowExpanded } = tableInstance;

  // Initialement, on déplie jusqu'à la sous-action, et jusqu'aux tâches
  // pour les sous-actions détaillées
  useEffect(() => {
    if (tableInstance.flatRows.length && !isSaving) {
      tableInstance.flatRows.forEach((row) =>
        toggleRowExpanded([row.original.identifiant], row.original.isExpanded)
      );
    }
  }, [table?.data?.length, toggleAllRowsExpanded, filters.statut.length]);

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
