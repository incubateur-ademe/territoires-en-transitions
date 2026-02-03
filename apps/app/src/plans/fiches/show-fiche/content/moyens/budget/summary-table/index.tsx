import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Input, ReactTable, TableCell, TableHeaderCell } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useFicheContext } from '../../../../context/fiche-context';
import { Budget } from '../../../../context/types';
import { emptyViewsProps } from '../../empty-view';
import { useBudgetSummaryForm } from '../use-budget-form';

type BudgetSummaryTableProps = {
  type: 'investissement' | 'fonctionnement';
};

type SummaryField = 'montant' | 'depense' | 'etpPrevisionnel' | 'etpReel';
type BudgetSummaryRow = {
  id: 'summary';
} & Pick<Budget, SummaryField>;
const columnHelper = createColumnHelper<BudgetSummaryRow>();

const CellValue = ({
  value,
  item,
}: {
  value: string | null;
  item: { unit: string };
}) => {
  if (!value)
    return (
      <span className="font-normal italic text-grey-6">Ajouter une valeur</span>
    );
  if (item.unit === 'ETP') return <ETPValue value={value} />;
  return (
    <span className="text-primary-9 font-medium">
      {value} {item.unit}
    </span>
  );
};

const ETPValue = ({ value }: { value: string | null }) => {
  return (
    <div className="flex">
      <span className="inline-flex items-center justify-center min-h-5 text-xs text-primary-9 font-bold px-2 bg-white border border-primary-9 rounded-md">
        {value ?? 'Ajouter une valeur'}
      </span>
    </div>
  );
};

export const BudgetSummaryTable = ({ type }: BudgetSummaryTableProps) => {
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const { budgets: budgetsState, isReadonly } = useFicheContext();
  const {
    upsert,
    [type]: { summary },
  } = budgetsState;
  const form = useBudgetSummaryForm(summary);

  const { control, handleSubmit, watch } = form;
  const currentValues = watch();
  const handleSubmitCallback = useMemo(
    () =>
      handleSubmit(async (data) => {
        await upsert.summary(data, type);
      }),
    [handleSubmit, type, upsert]
  );

  const summaryItems: {
    label: string;
    fieldName: SummaryField;
    getValue: (value: number | null | undefined) => string | null;
    unit: string;
    icon?: string;
  }[] = useMemo(
    () => [
      {
        label: 'Prévisionnel HT',
        fieldName: 'montant',
        getValue: (value) => (!isNil(value) ? getFormattedNumber(value) : null),
        unit: '€',
        icon: '€',
      },
      {
        label: 'Dépensé',
        fieldName: 'depense',
        getValue: (value) => (!isNil(value) ? getFormattedNumber(value) : null),
        unit: '€',
        icon: '€',
      },
      {
        label: 'ETP prévisionnel',
        fieldName: 'etpPrevisionnel',
        getValue: (value) => (!isNil(value) ? getFormattedFloat(value) : null),
        unit: 'ETP',
      },
      {
        label: 'ETP réel',
        fieldName: 'etpReel',
        getValue: (value) => (!isNil(value) ? getFormattedFloat(value) : null),
        unit: 'ETP',
      },
    ],
    []
  );

  const columns = useMemo(
    () =>
      summaryItems.map((item) =>
        columnHelper.display({
          id: `${item.fieldName}`,
          header: () => (
            <TableHeaderCell title={item.label} className="w-1/4" />
          ),
          cell: ({ row }) => {
            const value = item.getValue(row.original[item.fieldName]);

            return (
              <TableCell
                className="border-b border-gray-5 bg-grey-2"
                canEdit={!isReadonly}
                edit={{
                  onClose: handleSubmitCallback,
                  renderOnEdit: ({ openState }) => (
                    <Controller
                      control={control}
                      name={item.fieldName}
                      render={({ field: { onChange, value, name, ref } }) => (
                        <Input
                          type="number"
                          decimalScale={item.unit === 'ETP' ? 2 : 0}
                          icon={item.icon ? { text: item.icon } : undefined}
                          placeholder="Ajouter une valeur"
                          value={value?.toString() ?? ''}
                          onValueChange={({ floatValue, value: raw }) =>
                            onChange(raw === '' ? null : floatValue ?? null)
                          }
                          name={name}
                          ref={ref}
                          autoFocus
                          onKeyDown={(evt) => {
                            if (evt.key === 'Enter' || evt.key === 'Escape') {
                              openState.setIsOpen(false);
                            }
                          }}
                        />
                      )}
                    />
                  ),
                }}
              >
                <CellValue value={value} item={item} />
              </TableCell>
            );
          },
        })
      ),
    [control, handleSubmitCallback, isReadonly, summaryItems]
  );

  const tableData = useMemo<BudgetSummaryRow[]>(
    () => [
      {
        id: 'summary',
        montant: currentValues.montant,
        depense: currentValues.depense,
        etpPrevisionnel: currentValues.etpPrevisionnel,
        etpReel: currentValues.etpReel,
      },
    ],
    [
      currentValues.depense,
      currentValues.etpPrevisionnel,
      currentValues.etpReel,
      currentValues.montant,
    ]
  );

  const isEmpty = useMemo(() => {
    return tableData.every(
      (row) =>
        isNil(row.montant) &&
        isNil(row.depense) &&
        isNil(row.etpPrevisionnel) &&
        isNil(row.etpReel)
    );
  }, [tableData]);

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-2 bg-white rounded-lg border border-grey-3">
      <div className="max-2xl:overflow-x-auto">
        <div className="min-w-[600px]">
          <ReactTable
            table={table}
            isEmpty={isEmpty && !isAddingBudget}
            emptyCard={{
              ...emptyViewsProps[type],
              actions: isReadonly
                ? undefined
                : [
                    {
                      onClick: () => setIsAddingBudget(true),
                      children: 'Ajouter un budget',
                      icon: 'add-line',
                      variant: 'outlined',
                    },
                  ],
            }}
          />
        </div>
      </div>
    </div>
  );
};
