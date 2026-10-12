'use client';

import { createColumnHelper } from '@tanstack/react-table';
import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import { cn, TableCell, TableHeaderCell } from '@tet/ui';
import { ComponentPropsWithoutRef, JSX, useMemo } from 'react';
import { valueFieldsForPeriod } from './cell-editability';
import { IndicateurTitleCell } from './indicateur-title.cell';
import { IndicateurHeaderTitleCell } from './indicateur-title.header-cell';
import { IndicateurValeurYearHeaderCell } from './indicateur-valeur-year.header-cell';
import { IndicateurValeurCell } from './indicateur-valeur.cell';
import { IndicateurTableRow, isUnsetReferenceYear } from './types';
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
  // Les horizons PCAET restent annuels ; les cellules manipulent des périodes.
  const currentPeriod = IndicateurPeriods.parse(
    IndicateurPeriodiciteEnum.ANNUELLE,
    String(new Date().getFullYear())
  );

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

  const yearColumns = years.map((year) => {
    const isUnsetReference = isUnsetReferenceYear(year);
    const isReference = isUnsetReference || year === referenceYear;
    const period = isUnsetReference
      ? null
      : IndicateurPeriods.parse(
          IndicateurPeriodiciteEnum.ANNUELLE,
          String(year)
        );
    const periodId =
      period === null ? 'reference-unset' : IndicateurPeriods.key(period);
    const indicateurValeurTypes =
      period === null
        ? (['resultat'] as const)
        : valueFieldsForPeriod(period, currentPeriod);

    return columnHelper.group({
      id: periodId,
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
              isReference && !isReadonly ? onReferenceYearChange : undefined
            }
          />
        );
      },
      columns: indicateurValeurTypes.map((indicateurValeurType) =>
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

  return columnHelper.columns([titleColumn, ...yearColumns, widthBufferColumn]);
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
