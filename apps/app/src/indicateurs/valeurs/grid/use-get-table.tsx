'use client';

import {
  createColumnHelper,
  getCoreRowModel,
  Table,
  useReactTable,
} from '@tanstack/react-table';
import { JSX, RefObject, useMemo, useRef } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { useGridContext } from './grid-context';
import { findCell, GridDisplayRow, toDisplayRows } from './grid-model';
import { OpenDataCell } from './open-data-cell';
import { UserDataCell } from './user-data-cell';
import {
  GridCell,
  GridRowGroup,
  IndicateurId,
  IndicateurValuesGridActions,
  Year,
} from './types';

const columnHelper = createColumnHelper<GridDisplayRow>();

const EmptyCell = (): JSX.Element => <div className="h-full bg-grey-1" />;

const renderCell = ({
  cell,
  indicateurId,
  year,
  rowLabel,
  saveCellValue,
}: {
  cell: GridCell | null;
  indicateurId: IndicateurId;
  year: Year;
  rowLabel: string;
  saveCellValue: IndicateurValuesGridActions['saveCellValue'];
}): JSX.Element => {
  if (cell === null) {
    return <EmptyCell />;
  }
  if (cell.kind === 'open-data') {
    return (
      <OpenDataCell
        value={cell.value}
        source={cell.source}
        ariaLabel={appLabels.indicateurCelluleOpenData({
          rowLabel,
          year,
          value: cell.value,
          source: cell.source.libelle,
        })}
        indicateurId={indicateurId}
        year={year}
      />
    );
  }
  return (
    <UserDataCell
      cell={cell}
      ariaLabel={appLabels.indicateurCellule(rowLabel, year)}
      indicateurId={indicateurId}
      year={year}
      saveCellValue={saveCellValue}
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
          cell: ({ row }) =>
            renderCell({
              cell: findCell({
                cells,
                indicateurId: row.original.indicateurId,
                year,
              }),
              indicateurId: row.original.indicateurId,
              year,
              rowLabel: row.original.rowLabel,
              saveCellValue: actions.saveCellValue,
            }),
        })
      ),
    [years, cells, actions.saveCellValue]
  );

  const table = useReactTable({
    data: displayRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRef = useRef<HTMLTableElement>(null);

  return { table, tableRef };
};
