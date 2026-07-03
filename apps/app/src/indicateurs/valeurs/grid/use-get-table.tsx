'use client';

import {
  createColumnHelper,
  getCoreRowModel,
  Table,
  useReactTable,
} from '@tanstack/react-table';
import { JSX, RefObject, useMemo, useRef } from 'react';
import { useGridContext } from './grid-context';
import { findCell, GridDisplayRow, toDisplayRows } from './grid-model';
import { OpenDataCell } from './open-data-cell';
import { buildColumnSelection } from './open-data-picker/build-column-selection';
import { ColumnSelection } from './open-data-picker/open-data-picker';
import { UserDataCell } from './user-data-cell';
import { GridCell, GridRowGroup, IndicateurId, Year } from './types';

const columnHelper = createColumnHelper<GridDisplayRow>();

const EmptyCell = (): JSX.Element => <div className="h-full bg-grey-1" />;

const renderCell = ({
  cell,
  indicateurId,
  year,
  rowLabel,
  groupLabel,
  columnSelection,
}: {
  cell: GridCell | null;
  indicateurId: IndicateurId;
  year: Year;
  rowLabel: string;
  groupLabel: string;
  columnSelection?: ColumnSelection;
}): JSX.Element => {
  if (cell === null) {
    return <EmptyCell />;
  }
  if (cell.kind === 'open-data') {
    return (
      <OpenDataCell
        cell={cell}
        secteur={groupLabel}
        polluant={rowLabel}
        indicateurId={indicateurId}
        year={year}
        columnSelection={columnSelection}
      />
    );
  }
  return (
    <UserDataCell
      cell={cell}
      secteur={groupLabel}
      polluant={rowLabel}
      indicateurId={indicateurId}
      year={year}
      columnSelection={columnSelection}
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
  const { cells, actions } = useGridContext();

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
            const group = groups.find(
              (candidate) => candidate.id === row.original.groupId
            );
            return renderCell({
              cell,
              indicateurId: row.original.indicateurId,
              year,
              rowLabel: row.original.rowLabel,
              groupLabel: row.original.groupLabel,
              columnSelection:
                group === undefined
                  ? undefined
                  : buildColumnSelection({
                      cell,
                      group,
                      year,
                      cells,
                      selectOpenData: actions.selectOpenData,
                    }),
            });
          },
        })
      ),
    [years, cells, groups, actions.selectOpenData]
  );

  const table = useReactTable({
    data: displayRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRef = useRef<HTMLTableElement>(null);

  return { table, tableRef };
};
