'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { cn, TableCell, TableHeaderCell } from '@tet/ui';
import { ComponentPropsWithoutRef, JSX, useMemo } from 'react';
import { IndicateurTitleCell } from './indicateur-title.cell';
import { IndicateurHeaderTitleCell } from './indicateur-title.header-cell';
import { IndicateurValeurCell } from './indicateur-valeur.cell';
import { IndicateurTableRow, IndicateurPeriodColumn } from './types';
import { getTableMeta, IndicateurValeursTableFeatures } from './utils';

const columnHelper = createColumnHelper<
  IndicateurValeursTableFeatures,
  IndicateurTableRow
>();

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
  periodColumns: readonly IndicateurPeriodColumn[];
  title: string;
  unit: string;
  isReadonly?: boolean;
  showRequirementHint?: boolean;
};

const listColumns = ({
  periodColumns,
  title,
  unit,
  isReadonly,
}: ListIndicateurValeursTableColumnsParams) => {
  const titleColumn = columnHelper.display({
    id: 'title',
    header: () => <IndicateurHeaderTitleCell title={title} unit={unit} />,
    cell: ({ row, table }) => {
      const { setIndicateurApplicable } = getTableMeta(table);
      const { indicateurId, indicateurLabel, isApplicable } = row.original;

      return (
        <IndicateurTitleCell
          title={indicateurLabel}
          isApplicable={isApplicable}
          onApplicableChange={
            isReadonly
              ? undefined
              : (next) => {
                  void setIndicateurApplicable({
                    indicateurId,
                    isApplicable: next,
                  });
                }
          }
        />
      );
    },
  });

  const valeurColumns = periodColumns.map(
    ({ period, valeurTypes, renderHeader }) => {
      const periodId =
        period === null ? 'reference-unset' : IndicateurPeriods.key(period);
      return columnHelper.group({
        id: periodId,
        header: ({ header }) => renderHeader(header.colSpan),
        columns: valeurTypes.map((indicateurValeurType) =>
          columnHelper.display({
            id: `${periodId}-${indicateurValeurType}`,
            meta: { period, indicateurValeurType },
            cell: (cellContext) => {
              return (
                <IndicateurValeurCell
                  cell={cellContext}
                  indicateurValeurType={indicateurValeurType}
                  period={period}
                  isRequired={cellContext.row.original.isValeurRequired(period)}
                  isReadonly={isReadonly || period === null}
                />
              );
            },
          })
        ),
      });
    }
  );

  const widthBufferColumn = columnHelper.display({
    id: 'width-buffer',
    header: () => <TableHeaderCell className="w-auto" aria-hidden />,
    cell: () => <EmptyValueCell aria-hidden />,
  });

  return columnHelper.columns([
    titleColumn,
    ...valeurColumns,
    widthBufferColumn,
  ]);
};

export function useListIndicateurValeursTableColumns({
  periodColumns,
  title,
  unit,
  isReadonly,
}: ListIndicateurValeursTableColumnsParams) {
  const columns = useMemo(
    () =>
      listColumns({
        periodColumns,
        title,
        unit,
        isReadonly,
      }),
    [periodColumns, title, unit, isReadonly]
  );

  return { columns };
}
