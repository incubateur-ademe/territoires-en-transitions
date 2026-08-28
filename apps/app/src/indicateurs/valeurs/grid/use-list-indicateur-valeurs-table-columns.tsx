'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { cn, TableCell, TableHeaderCell } from '@tet/ui';
import { ComponentPropsWithoutRef, JSX, useMemo } from 'react';
import { valueFieldsForYear as indicateurValeurTypesForYear } from './cell-editability';
import { IndicateurTitleCell } from './indicateur-title.cell';
import { IndicateurHeaderTitleCell } from './indicateur-title.header-cell';
import { IndicateurValeurYearHeaderCell } from './indicateur-valeur-year.header-cell';
import { IndicateurValeurCell } from './indicateur-valeur.cell';
import { IndicateurTableRow, isUnsetReferenceYear } from './types';
import { getTableMeta } from './utils';

const columnHelper = createColumnHelper<IndicateurTableRow>();

const EmptyValueCell = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TableCell>): JSX.Element => (
  <TableCell
    className={cn('border-b border-r border-grey-3', className)}
    {...props}
  />
);

type ListIndicateurValeursTableColumnsParams = {
  years: number[];
  title: string;
  unit: string;
  isReadonly?: boolean;
  referenceYear?: number | null;
  showRequirementHint?: boolean;
};

const listColumns = ({
  years,
  title,
  unit,
  isReadonly,
  referenceYear,
}: ListIndicateurValeursTableColumnsParams) => {
  const now = new Date().getFullYear();

  const titleColumn = columnHelper.display({
    id: 'title',
    header: () => <IndicateurHeaderTitleCell title={title} unit={unit} />,
    cell: ({ row }) => (
      <IndicateurTitleCell title={row.original.indicateurLabel} />
    ),
  });

  const yearColumns = years.map((year) => {
    const isUnsetReference = isUnsetReferenceYear(year);
    const isReference = isUnsetReference || year === referenceYear;
    const indicateurValeurTypes = indicateurValeurTypesForYear(year, now);

    return columnHelper.group({
      id: `year-${year}`,
      header: ({ header, table }) => {
        const { onReferenceYearChange } = getTableMeta(table);

        return (
          <IndicateurValeurYearHeaderCell
            year={isUnsetReference ? null : year}
            colSpan={header.colSpan}
            isReference={isReference}
            displayedYears={years.filter(
              (candidate) => !isUnsetReferenceYear(candidate)
            )}
            onReferenceYearChange={
              isReference ? onReferenceYearChange : undefined
            }
          />
        );
      },
      columns: indicateurValeurTypes.map((indicateurValeurType) =>
        columnHelper.display({
          id: `year-${year}-${indicateurValeurType}`,
          meta: { year, indicateurValeurType },
          cell: (cellContext) => {
            return (
              <IndicateurValeurCell
                cell={cellContext}
                indicateurValeurType={indicateurValeurType}
                year={year}
                isReadonly={isReadonly || isUnsetReference}
              />
            );
          },
        })
      ),
    });
  });

  const widthBufferColumn = columnHelper.display({
    id: 'width-buffer',
    header: () => <TableHeaderCell className="w-auto" aria-hidden />,
    cell: () => <EmptyValueCell aria-hidden />,
  });

  return [titleColumn, ...yearColumns, widthBufferColumn];
};

export function useListIndicateurValeursTableColumns({
  years,
  title,
  unit,
  isReadonly,
  referenceYear,
}: ListIndicateurValeursTableColumnsParams) {
  const columns = useMemo(
    () =>
      listColumns({
        years,
        title,
        unit,
        isReadonly,
        referenceYear,
      }),
    [years, title, unit, isReadonly, referenceYear]
  );

  return { columns };
}
