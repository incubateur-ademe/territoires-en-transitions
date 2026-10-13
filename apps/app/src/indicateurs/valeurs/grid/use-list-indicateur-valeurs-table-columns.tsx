'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { cn, TableCell, TableHeaderCell } from '@tet/ui';
import { ComponentPropsWithoutRef, JSX, useMemo } from 'react';
import { IndicateurTitleCell } from './indicateur-title.cell';
import { IndicateurHeaderTitleCell } from './indicateur-title.header-cell';
import { IndicateurValeurCell } from './indicateur-valeur.cell';
import { IndicateurTableRow, IndicateurPeriodeColumn } from './types';
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
  periodeColumns: readonly IndicateurPeriodeColumn[];
  title: string;
  unit: string;
  isReadonly?: boolean;
  showRequirementHint?: boolean;
};

const listColumns = ({
  periodeColumns,
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

  const valeurColumns = periodeColumns.map(
    ({ periode, valeurTypes, renderHeader }) => {
      const periodeId =
        periode === null ? 'reference-unset' : IndicateurPeriodes.key(periode);
      return columnHelper.group({
        id: periodeId,
        header: ({ header }) => renderHeader(header.colSpan),
        columns: valeurTypes.map((indicateurValeurType) =>
          columnHelper.display({
            id: `${periodeId}-${indicateurValeurType}`,
            meta: { periode, indicateurValeurType },
            cell: (cellContext) => {
              return (
                <IndicateurValeurCell
                  cell={cellContext}
                  indicateurValeurType={indicateurValeurType}
                  periode={periode}
                  isRequired={cellContext.row.original.isValeurRequired(
                    periode
                  )}
                  isReadonly={isReadonly || periode === null}
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
  periodeColumns,
  title,
  unit,
  isReadonly,
}: ListIndicateurValeursTableColumnsParams) {
  const columns = useMemo(
    () =>
      listColumns({
        periodeColumns,
        title,
        unit,
        isReadonly,
      }),
    [periodeColumns, title, unit, isReadonly]
  );

  return { columns };
}
