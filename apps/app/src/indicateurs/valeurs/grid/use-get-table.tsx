'use client';

import {
  createColumnHelper,
  getCoreRowModel,
  Table,
  useReactTable,
} from '@tanstack/react-table';
import { JSX, RefObject, useMemo, useRef } from 'react';
import { resolveVariationToReferenceYear } from './variation/variation';
import { useGridContext } from './grid-context';
import { findCell, GridDisplayRow, toDisplayRows } from './grid-model';
import { ValuesCell } from './values-cell';
import { GridCell, GridRowGroup, IndicateurId, Year } from './types';

const columnHelper = createColumnHelper<GridDisplayRow>();

const EmptyCell = (): JSX.Element => <div className="h-full bg-grey-1" />;

const renderCell = ({
  cell,
  indicateurId,
  year,
  rowLabel,
  groupLabel,
  variationToReferenceYear,
}: {
  cell: GridCell | null;
  indicateurId: IndicateurId;
  year: Year;
  rowLabel: string;
  groupLabel: string;
  variationToReferenceYear: number | null;
}): JSX.Element => {
  if (cell === null) {
    return <EmptyCell />;
  }
  return (
    <ValuesCell
      cell={cell}
      groupLabel={groupLabel}
      rowLabel={rowLabel}
      indicateurId={indicateurId}
      year={year}
      variationToReferenceYear={variationToReferenceYear}
    />
  );
};

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
  const { cells, referenceYear } = useGridContext();

  const displayRows = useMemo<GridDisplayRow[]>(
    () => toDisplayRows(groups),
    [groups]
  );

  const columns = useMemo(
    () =>
      years.map((year) =>
        columnHelper.display({
          id: `year-${year}`,
          cell: ({ row }) => {
            const cell = findCell({
              cells,
              indicateurId: row.original.indicateurId,
              year,
            });
            return renderCell({
              cell,
              indicateurId: row.original.indicateurId,
              year,
              rowLabel: row.original.rowLabel,
              groupLabel: row.original.groupLabel,
              variationToReferenceYear: resolveVariationToReferenceYear({
                cell,
                cells,
                indicateurId: row.original.indicateurId,
                year,
                referenceYear,
              }),
            });
          },
        })
      ),
    [years, cells, referenceYear]
  );

  const table = useReactTable({
    data: displayRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRef = useRef<HTMLTableElement>(null);

  return { table, tableRef };
};
