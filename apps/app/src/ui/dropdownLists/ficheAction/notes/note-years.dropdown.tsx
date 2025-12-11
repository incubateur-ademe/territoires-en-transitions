import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { SelectFilter, SelectProps } from '@tet/ui';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: (value: string[]) => void;
};

export const NoteYearsDropdown = ({ onChange, values }: Props) => {
  return (
    <SelectFilter
      values={values ?? undefined}
      dataTest={'anneesNote'}
      options={getYearsOptions(1).yearsOptions}
      onChange={({ values }) => {
        onChange(values as string[]);
      }}
    />
  );
};
