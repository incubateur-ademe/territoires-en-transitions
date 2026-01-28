import { getFormattedFloat, getFormattedNumber } from '@/app/utils/formatUtils';
import { cn, Input, Table, TableCell, TableHead, TableRow } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { Controller } from 'react-hook-form';
import { useFicheContext } from '../../../../context/fiche-context';
import { Budget } from '../../../../context/types';
import { useBudgetSummaryForm } from '../use-budget-form';

type BudgetSummaryTableProps = {
  type: 'investissement' | 'fonctionnement';
};

const HeaderCell = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <th
      className={cn(
        'text-left uppercase text-sm text-grey-9 font-medium py-3 pl-4 bg-white',
        className
      )}
    >
      <div>{children}</div>
    </th>
  );
};

const ETPValue = ({ value }: { value: string | null }) => {
  return (
    <div className="flex items-center justify-center text-xs text-primary-9 font-bold py-2 px-2 bg-white border-primary-9 border rounded-md w-6 h-5">
      {value ?? '-'}
    </div>
  );
};

export const BudgetSummaryTable = ({ type }: BudgetSummaryTableProps) => {
  const { budgets: budgetsState, isReadonly } = useFicheContext();
  const {
    upsert,
    [type]: { summary },
  } = budgetsState;
  const form = useBudgetSummaryForm(summary);

  const { control, handleSubmit, watch } = form;
  const currentValues = watch();
  const handleSubmitCallback = handleSubmit(async (data) => {
    await upsert.summary(data, type);
  });

  const summaryItems: {
    label: string;
    fieldName: keyof Budget;
    getValue: () => string | null;
    unit: string;
    icon?: string;
  }[] = [
    {
      label: 'PREVISIONNEL HT',
      fieldName: 'montant',
      getValue: () =>
        !isNil(currentValues.montant)
          ? getFormattedNumber(currentValues.montant)
          : null,
      unit: '€',
      icon: '€',
    },
    {
      label: 'DÉPENSÉ',
      fieldName: 'depense',
      getValue: () =>
        !isNil(currentValues.depense)
          ? getFormattedNumber(currentValues.depense)
          : null,
      unit: '€',
      icon: '€',
    },
    {
      label: 'ETP PRÉVISIONNEL',
      fieldName: 'etpPrevisionnel',
      getValue: () =>
        !isNil(currentValues.etpPrevisionnel)
          ? getFormattedFloat(currentValues.etpPrevisionnel)
          : null,
      unit: 'ETP',
    },
    {
      label: 'ETP RÉEL',
      fieldName: 'etpReel',
      getValue: () =>
        !isNil(currentValues.etpReel)
          ? getFormattedFloat(currentValues.etpReel)
          : null,
      unit: 'ETP',
    },
  ];

  return (
    <Table className="border-separate border-spacing-0 border border-gray-3 bg-grey-1 rounded-lg overflow-hidden min-w-[600px]">
      <TableHead>
        <tr>
          {summaryItems.map((item) => (
            <HeaderCell key={item.label} className="min-w-[130px] md:w-[150px]">
              {item.label}
            </HeaderCell>
          ))}
        </tr>
      </TableHead>
      <tbody>
        <TableRow className="bg-grey-2 ">
          {summaryItems.map((item) => {
            const value = item.getValue();
            return (
              <TableCell
                key={item.label}
                className="text-primary-9 font-medium border-b border-gray-5"
                canEdit={!isReadonly}
                edit={{
                  onClose: handleSubmitCallback,
                  renderOnEdit: () => (
                    <Controller
                      control={control}
                      name={item.fieldName}
                      render={({ field: { onChange, value, name } }) => (
                        <Input
                          type="number"
                          decimalScale={item.unit === 'ETP' ? 2 : 0}
                          icon={item.icon ? { text: item.icon } : undefined}
                          placeholder={`Ajouter ${item.label.toLowerCase()}`}
                          value={value?.toString() ?? ''}
                          onValueChange={({ floatValue, value: raw }) =>
                            onChange(raw === '' ? null : floatValue ?? null)
                          }
                          name={name}
                        />
                      )}
                    />
                  ),
                }}
              >
                {item.unit === 'ETP' ? (
                  <ETPValue value={value} />
                ) : (
                  <span>
                    {value ?? '-'} {item.unit}
                  </span>
                )}
              </TableCell>
            );
          })}
        </TableRow>
      </tbody>
    </Table>
  );
};
