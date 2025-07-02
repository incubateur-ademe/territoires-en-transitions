import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { SelectFilter, SelectProps } from '@/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: (value: string[]) => void;
};

export const AnneesNoteDeSuiviDropdown = ({ onChange, values }: Props) => {
  return (
    <SelectFilter
      values={values ?? undefined}
      dataTest={'anneesNoteDeSuivi'}
      options={getYearsOptions(1).yearsOptions}
      onChange={({ values }) => {
        onChange(values as string[]);
      }}
    />
  );
};
