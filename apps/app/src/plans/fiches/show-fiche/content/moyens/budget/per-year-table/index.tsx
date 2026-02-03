import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Button,
  ReactTable,
  Spacer,
  TableCell,
  TableHeaderCell,
} from '@tet/ui';
import { useEffect, useMemo } from 'react';
import { useFicheContext } from '../../../../context/fiche-context';
import { BudgetPerYear } from '../../../../context/types';
import { getYearsOptions } from '../../../../utils';
import { emptyViewsProps } from '../../empty-view';
import { BudgetPerYearFormProvider } from './budget-per-year-form.context';
import {
  BudgetPerYearActionsCell,
  BudgetPerYearDepenseCell,
  BudgetPerYearEtpPrevisionnelCell,
  BudgetPerYearEtpReelCell,
  BudgetPerYearMontantCell,
  BudgetPerYearYearCell,
} from './budget-per-year.cells';

type BudgetTableRow =
  | {
      id: string;
      type: 'budget';
      budget: BudgetPerYear;
    }
  | {
      id: 'total';
      type: 'total';
    };

const columnHelper = createColumnHelper<BudgetTableRow>();

export const BudgetPerYearTable = ({
  type,
}: {
  type: 'investissement' | 'fonctionnement';
}) => {
  const { budgets: budgetsState, fiche, isReadonly } = useFicheContext();
  const { upsert, deleteBudgets, [type]: budgets } = budgetsState;

  const usedYears = useMemo(
    () => budgets.perYear.map((budget) => budget.year),
    [budgets.perYear]
  );
  const allYearsOptions = useMemo(() => getYearsOptions(7).yearsOptions, []);
  const yearsOptions = useMemo(
    () => allYearsOptions.filter((year) => !usedYears.includes(year.value)),
    [allYearsOptions, usedYears]
  );

  const tableData = useMemo<BudgetTableRow[]>(() => {
    const rows: BudgetTableRow[] = budgets.perYear.map((budget) => ({
      id: `${budget.year}`,
      type: 'budget',
      budget,
    }));

    rows.push({ id: 'total', type: 'total' });
    return rows;
  }, [budgets.perYear]);
  const totals = useMemo(
    () =>
      budgets.perYear.reduce(
        (acc, row) => ({
          montant: acc.montant + (row.montant ?? 0),
          depense: acc.depense + (row.depense ?? 0),
          etpPrevisionnel: acc.etpPrevisionnel + (row.etpPrevisionnel ?? 0),
          etpReel: acc.etpReel + (row.etpReel ?? 0),
        }),
        {
          montant: 0,
          depense: 0,
          etpPrevisionnel: 0,
          etpReel: 0,
        }
      ),
    [budgets.perYear]
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'year',
        header: () => <TableHeaderCell title="Année" className="w-[150px]" />,
        cell: ({ row }) => {
          if (row.original.type === 'total') {
            return (
              <TableCell className="font-medium text-primary-9 text-sm border-b border-gray-5 bg-primary-3">
                TOTAL
              </TableCell>
            );
          }
          const currentYear = row.original.budget.year;

          const availableYearOptions = allYearsOptions.filter(
            (yearOption) =>
              yearOption.value === currentYear ||
              !usedYears.includes(yearOption.value)
          );

          return (
            <BudgetPerYearYearCell
              availableYearOptions={availableYearOptions}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'montant',
        header: () => <TableHeaderCell title="Montant" />,
        cell: ({ row }) => {
          if (row.original.type === 'total') {
            return (
              <TableCell className="font-medium text-primary-9 border-b border-gray-5 bg-primary-3">
                <span>
                  {getFormattedNumber(totals.montant)} €{' '}
                  <sup className="-top-[0.4em]">HT</sup>
                </span>
              </TableCell>
            );
          }
          return <BudgetPerYearMontantCell />;
        },
      }),
      columnHelper.display({
        id: 'depense',
        header: () => <TableHeaderCell title="Dépensé" />,
        cell: ({ row }) => {
          if (row.original.type === 'total') {
            return (
              <TableCell className="font-medium text-primary-9 border-b border-gray-5 bg-primary-3">
                <span>{getFormattedNumber(totals.depense)} € </span>
              </TableCell>
            );
          }
          return <BudgetPerYearDepenseCell />;
        },
      }),
      columnHelper.display({
        id: 'etpPrevisionnel',
        header: () => <TableHeaderCell title="ETP prévisionnel" />,
        cell: ({ row }) => {
          if (row.original.type === 'total') {
            return (
              <TableCell className="font-medium text-primary-9 border-b border-gray-5 bg-primary-3">
                <span>{getFormattedFloat(totals.etpPrevisionnel)} ETP</span>
              </TableCell>
            );
          }
          return <BudgetPerYearEtpPrevisionnelCell />;
        },
      }),
      columnHelper.display({
        id: 'etpReel',
        header: () => <TableHeaderCell title="ETP Réel" />,
        cell: ({ row }) => {
          if (row.original.type === 'total') {
            return (
              <TableCell className="font-medium text-primary-9 border-b border-gray-5 bg-primary-3">
                {<span>{getFormattedFloat(totals.etpReel) ?? '-'} ETP</span>}
              </TableCell>
            );
          }
          return <BudgetPerYearEtpReelCell />;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <TableHeaderCell icon="more-2-line" />,
        cell: ({ row }) => {
          if (row.original.type === 'total') {
            return (
              <TableCell className="border-b border-gray-5 bg-primary-3" />
            );
          }
          return (
            <BudgetPerYearActionsCell
              fiche={fiche}
              onDeleteBudget={(year) => deleteBudgets(year, type)}
            />
          );
        },
      }),
    ],
    [allYearsOptions, usedYears, fiche, deleteBudgets, type, totals]
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    table.getColumn('actions')?.toggleVisibility(!isReadonly);
  }, [isReadonly, table]);

  return (
    <div className="p-2 bg-white rounded-lg border border-grey-3">
      <div className="max-2xl:overflow-x-auto">
        <div className="min-w-[800px]">
          <ReactTable
            table={table}
            isEmpty={budgets.perYear.length === 0}
            emptyCard={{
              ...emptyViewsProps[type],
              actions: isReadonly
                ? undefined
                : [
                    {
                      onClick: async () => {
                        await upsert.year(
                          { year: new Date().getFullYear() },
                          type
                        );
                      },
                      children: 'Ajouter un budget',
                      icon: 'add-line',
                      variant: 'outlined',
                    },
                  ],
            }}
            rowWrapper={({ row, children }) => {
              if (row.original.type === 'budget') {
                return (
                  <BudgetPerYearFormProvider
                    budget={row.original.budget}
                    isReadonly={isReadonly}
                    onUpsertBudget={(budget) => upsert.year(budget, type)}
                  >
                    {children}
                  </BudgetPerYearFormProvider>
                );
              }
              return children;
            }}
          />
        </div>
      </div>
      <Spacer height={1} />
      {!isReadonly && budgets.perYear.length > 0 && (
        <Button
          size="xs"
          icon="add-line"
          variant="outlined"
          className="m-4"
          disabled={yearsOptions.length === 0}
          onClick={async () => {
            const firstYearOption = yearsOptions[0];
            if (!firstYearOption) {
              return;
            }
            await upsert.year({ year: firstYearOption.value }, type);
          }}
        >
          Ajouter un budget
        </Button>
      )}
    </div>
  );
};
