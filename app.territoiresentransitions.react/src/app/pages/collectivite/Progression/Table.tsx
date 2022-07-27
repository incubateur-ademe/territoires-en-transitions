import {useEffect, useMemo, useRef} from 'react';
import {
  CellProps,
  HeaderProps,
  useTable,
  useExpanded,
  useFlexLayout,
} from 'react-table';
import {useReferentielId} from 'core-logic/hooks/params';
import ReferentielTable from '../ReferentielTable';
import {TableData} from './useTableData';
import {getMaxDepth, ProgressionRow} from './queries';
import {columns, initialState, getHiddenColumnsId} from './columns';

export type TDetailTacheTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<ProgressionRow> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<ProgressionRow>;

/**
 * Affiche la table "Aide à la priorisation"
 */
export const Table = (props: TDetailTacheTableProps) => {
  const {tableData} = props;
  const {table, isLoading, filters, setFilters, options, headerRow} = tableData;
  const {visibleColumns} = options;

  const referentiel = useReferentielId();
  const maxDepth = getMaxDepth(referentiel);

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  const customCellProps = useMemo(() => ({maxDepth}), [maxDepth]);
  const customHeaderProps = useMemo(() => ({filters, setFilters}), [filters]);

  // crée l'instance de la table
  const {data, ...other} = table;
  const d = headerRow ? [headerRow, ...data] : data;
  const tableInstance = useTable(
    {data: d, ...other, columns, initialState},
    useExpanded,
    useFlexLayout
  );
  const {toggleAllRowsExpanded, setHiddenColumns} = tableInstance;

  // met à jour les colonnes visibles lorsque c'est nécessaire
  useEffect(() => {
    const hiddenColumns = getHiddenColumnsId(visibleColumns);
    setHiddenColumns(hiddenColumns);
  }, [visibleColumns, setHiddenColumns]);

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
      customCellProps={customCellProps}
      customHeaderProps={customHeaderProps}
    />
  );
};
