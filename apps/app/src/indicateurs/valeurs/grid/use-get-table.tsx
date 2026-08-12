'use client';

import { getCoreRowModel, Table, useReactTable } from '@tanstack/react-table';
import { RefObject, useMemo, useRef } from 'react';
import { useGridContext } from './grid-context';
import { GridDisplayRow, toDisplayRows } from './grid-model';
import { GridRowGroup, Year } from './types';
import { useListIndicateurValeursTableColumns } from './use-list-indicateur-valeurs-table-columns';

export const useGetTable = ({
  groups,
  years,
}: {
  groups: GridRowGroup[];
  years: Year[];
}): {
  table: Table<GridDisplayRow>;
  tableRef: RefObject<HTMLTableElement | null>;
} => {
  const {
    cells,
    title,
    unit,
    referenceYear,
    isReadonly,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
    referencesVariant,
  } = useGridContext();

  const displayRows = useMemo<GridDisplayRow[]>(
    () => toDisplayRows(groups),
    [groups]
  );

  const { columns } = useListIndicateurValeursTableColumns({
    groups,
    years,
    cells,
    title,
    unit,
    referenceYear,
    isReadonly,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
    referencesVariant,
  });

  const table = useReactTable({
    data: displayRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRef = useRef<HTMLTableElement>(null);

  return { table, tableRef };
};
