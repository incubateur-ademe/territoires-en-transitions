'use client';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { JSX, useMemo } from 'react';
import { useGridContext } from './grid-context';
import { findCell, GridDisplayRow, toDisplayRows } from './grid-model';
import { GroupRowHeader } from './group-row-header';
import { RowHeader } from './row-header';
import { OpenDataCell } from './open-data-cell';
import { GridCell } from './types';
import { UserDataCell } from './user-data-cell';
import { YearColumnHeader } from './year-column-header';

const columnHelper = createColumnHelper<GridDisplayRow>();

const EmptyCell = (): JSX.Element => <div className="h-full bg-grey-1" />;

const renderCell = (cell: GridCell | null): JSX.Element => {
  if (cell === null) {
    return <EmptyCell />;
  }
  if (cell.kind === 'open-data') {
    return <OpenDataCell value={cell.value} source={cell.source} />;
  }
  return <UserDataCell value={cell.value} coveringSources={cell.coveringSources} />;
};

export const GridFrame = (): JSX.Element => {
  const { groups, years, referenceYear, unit, cells } = useGridContext();

  const displayRows = useMemo<GridDisplayRow[]>(
    () => toDisplayRows(groups),
    [groups]
  );

  const columns = useMemo(
    () =>
      years.map((year) =>
        columnHelper.display({
          id: `year-${year}`,
          cell: ({ row }) =>
            renderCell(findCell({ cells, indicateurId: row.original.indicateurId, year })),
        })
      ),
    [years, cells]
  );

  const table = useReactTable({
    data: displayRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-h-[70vh] overflow-auto">
      <table className="w-full border-collapse text-sm" role="grid">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 top-0 z-30 border border-grey-3 bg-grey-1 p-2"
            />
            <th scope="col" className="sticky top-0 z-20 border border-grey-3 bg-grey-1 p-2" />
            {years.map((year) => (
              <YearColumnHeader
                key={year}
                year={year}
                unit={unit}
                isReference={year === referenceYear}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.original.isGroupStart && (
                <GroupRowHeader
                  label={row.original.groupLabel}
                  rowSpan={row.original.groupSize}
                />
              )}
              <RowHeader label={row.original.rowLabel} />
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="h-10 border border-grey-3 p-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
