import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { SelectFilter, SelectProps } from '@/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: (value: string[]) => void;
};

const AnneesNoteDeSuiviDropdown = ({ onChange, values }: Props) => {
  return (
    <SelectFilter
      values={values ?? undefined}
      dataTest={'hasNoteDeSuivi'}
      options={getYearsOptions().yearsOptions}
      onChange={({ values, selectedValue }) => {
        onChange(values as string[]);
      }}
    />
  );
};

export default AnneesNoteDeSuiviDropdown;
