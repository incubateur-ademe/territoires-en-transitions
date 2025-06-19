import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { Select, SelectProps } from '@/ui';
import { useState } from 'react';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: (value: string[]) => void;
};

const AnneesNoteDeSuiviDropdown = (props: Props) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const onHandleChange = (value: string) => {
    const newValuesIndex = selectedOptions.indexOf(value);
    if (newValuesIndex !== -1) {
      selectedOptions.splice(newValuesIndex, 1);
    } else {
      selectedOptions.push(value);
    }
    setSelectedOptions(selectedOptions);
    props.onChange(selectedOptions);
  };

  return (
    <Select
      {...props}
      values={props.values ?? undefined}
      dataTest={props.dataTest ?? 'noteDeSuivi'}
      options={getYearsOptions().yearsOptions}
      onChange={(value) => {
        onHandleChange(value as string);
      }}
    />
  );
};

export default AnneesNoteDeSuiviDropdown;
