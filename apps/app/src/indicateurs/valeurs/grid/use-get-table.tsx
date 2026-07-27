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
import { ValueFieldCell } from './value-field-cell';
import { GridRowGroup, ValeurField, Year } from './types';

const columnHelper = createColumnHelper<GridDisplayRow>();

const VALUE_FIELDS: readonly ValeurField[] = ['resultat', 'objectif'];

const EmptyCell = (): JSX.Element => <div className="h-full bg-grey-1" />;

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
      years.flatMap((year) =>
        VALUE_FIELDS.map((field) =>
          columnHelper.display({
            id: `year-${year}-${field}`,
            meta: { year, field },
            cell: ({ row }) => {
              const cell = findCell({
                cells,
                indicateurId: row.original.indicateurId,
                year,
              });
              if (cell === null) {
                return <EmptyCell />;
              }
              return (
                <ValueFieldCell
                  field={field}
                  cell={cell}
                  groupLabel={row.original.groupLabel}
                  rowLabel={row.original.rowLabel}
                  indicateurId={row.original.indicateurId}
                  year={year}
                  variationToReferenceYear={resolveVariationToReferenceYear({
                    cell,
                    cells,
                    indicateurId: row.original.indicateurId,
                    year,
                    referenceYear,
                  })}
                />
              );
            },
          })
        )
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
