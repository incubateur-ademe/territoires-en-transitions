'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { cn, TableCell, TableHeaderCell } from '@tet/ui';
import { JSX, useMemo } from 'react';
import { AddYearColumnHeader } from './add-year-column-header';
import { valueFieldsForYear } from './cell-editability';
import type { ReferencesVariant } from './cell-references';
import { columnHasValues } from './column-has-values';
import { findCell, GridDisplayRow } from './grid-model';
import { IndicateurTitleCell } from './indicateur-title.cell';
import { IndicateurHeaderTitleCell } from './indicateur-title.header-cell';
import { IndicateurValeurYearHeaderCell } from './indicateur-valeur-year.header-cell';
import { IndicateurValeurCell } from './indicateur-valeur.cell';
import { CellKey, GridCell, GridRowGroup, Year } from './types';

const columnHelper = createColumnHelper<GridDisplayRow>();

const EmptyValueCell = ({ className }: { className?: string }): JSX.Element => (
  <TableCell className={cn('border-b border-r border-grey-3', className)} />
);

type ListIndicateurValeursTableColumnsParams = {
  groups: GridRowGroup[];
  years: Year[];
  cells: Map<CellKey, GridCell>;
  title: string;
  unit: string;
  referenceYear: Year | null;
  isReadonly?: boolean;
  onAddYear?: (year: Year) => void;
  onRemoveYear?: (year: Year) => void;
  canRemoveYear?: (year: Year) => boolean;
  referencesVariant?: ReferencesVariant;
};

const getColumns = ({
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
}: ListIndicateurValeursTableColumnsParams) => {
  const now = new Date().getFullYear();
  const indicateurIds = groups.flatMap((group) =>
    group.rows.map((row) => row.indicateurId)
  );

  const titleColumn = columnHelper.display({
    id: 'title',
    header: () => <IndicateurHeaderTitleCell title={title} unit={unit} />,
    cell: ({ row }) => <IndicateurTitleCell title={row.original.rowLabel} />,
  });

  const yearColumns = years.map((year) => {
    const fields = valueFieldsForYear(year, now, referenceYear);
    const canRemove =
      onRemoveYear !== undefined &&
      (canRemoveYear?.(year) ?? year !== referenceYear);
    const hasValues = columnHasValues({ cells, year, indicateurIds });

    return columnHelper.group({
      id: `year-${year}`,
      header: ({ header }) => (
        <IndicateurValeurYearHeaderCell
          year={year}
          colSpan={header.colSpan}
          isReference={year === referenceYear}
          onRemoveYear={onRemoveYear}
          canRemove={canRemove}
          hasValues={hasValues}
        />
      ),
      columns: fields.map((field) =>
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
              return <EmptyValueCell />;
            }

            return (
              <IndicateurValeurCell
                field={field}
                cell={cell}
                indicateurId={row.original.indicateurId}
                year={year}
                isReadonly={isReadonly}
                referencesVariant={referencesVariant}
              />
            );
          },
        })
      ),
    });
  });

  const addYearColumn = columnHelper.display({
    id: 'addYear',
    header: () => (
      <AddYearColumnHeader years={years} onAddYear={onAddYear ?? (() => {})} />
    ),
    cell: () => (
      <TableCell
        className="sticky right-0 z-10 bg-inherit border-b border-grey-3"
        aria-hidden
      />
    ),
  });

  const widthBufferColumn = columnHelper.display({
    id: 'width-buffer',
    header: () => <TableHeaderCell className="w-auto" aria-hidden />,
    cell: () => <EmptyValueCell aria-hidden />,
  });

  return [
    titleColumn,
    ...yearColumns,
    ...(onAddYear !== undefined ? [addYearColumn] : []),
    widthBufferColumn,
  ];
};

export function useListIndicateurValeursTableColumns(
  params: ListIndicateurValeursTableColumnsParams
) {
  const {
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
  } = params;

  const columns = useMemo(
    () =>
      getColumns({
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
      }),
    [
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
    ]
  );

  return { columns };
}
