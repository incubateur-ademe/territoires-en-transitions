import { Input, Select, SelectOption } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { OpenState } from '@tet/ui/utils/types';
import { Control, Controller } from 'react-hook-form';
import { BudgetPerYear } from '../../../../context/types';

type BudgetPerYearYearSelectProps = {
  availableYearOptions: SelectOption[];
  control: Control<BudgetPerYear>;
  placeholder?: string;
  openState?: OpenState;
};

export const BudgetPerYearYearSelect = ({
  availableYearOptions,
  control,
  placeholder = 'Sélectionner une année',
  openState,
}: BudgetPerYearYearSelectProps) => (
  <Controller
    control={control}
    name="year"
    render={({ field: { onChange, value } }) => (
      <Select
        dropdownZindex={10}
        options={availableYearOptions}
        values={value}
        onChange={(selectedYear) => {
          if (selectedYear) {
            const numericYear = selectedYear as number;
            onChange(numericYear);
          }
        }}
        placeholder={placeholder}
        openState={openState}
        showCustomItemInBadges={true}
        customItem={(option) => (
          <div className="text-sm text-grey-9">{option.label}</div>
        )}
      />
    )}
  />
);

type BudgetPerYearInputFieldProps = {
  control: Control<BudgetPerYear>;
  name: 'montant' | 'depense' | 'etpPrevisionnel' | 'etpReel';
  decimalScale: number;
  iconText: string;
  placeholder: string;
  inputClassName?: string;
  errorClassName?: string;
  onKeyDown?: (evt: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const BudgetPerYearInputField = ({
  control,
  name,
  decimalScale,
  iconText,
  placeholder,
  inputClassName,
  errorClassName,
  onKeyDown,
}: BudgetPerYearInputFieldProps) => (
  <Controller
    control={control}
    name={name}
    render={({
      fieldState: { error },
      field: { onChange, value, name, ref },
    }) => (
      <Input
        className={cn(inputClassName, error ? errorClassName : '')}
        type="number"
        decimalScale={decimalScale}
        icon={{ text: iconText }}
        placeholder={placeholder}
        value={value?.toString() ?? ''}
        onValueChange={({ floatValue, value: raw }) =>
          onChange(raw === '' ? null : floatValue ?? null)
        }
        name={name}
        ref={ref}
        onKeyDown={onKeyDown}
      />
    )}
  />
);

type BudgetPerYearNewRowInputFieldProps = Omit<
  BudgetPerYearInputFieldProps,
  'inputClassName' | 'errorClassName'
>;

export const BudgetPerYearNewRowInputField = (
  props: BudgetPerYearNewRowInputFieldProps
) => (
  <BudgetPerYearInputField
    {...props}
    inputClassName="w-full min-w-[100px]"
    errorClassName="bg-error-2"
  />
);
