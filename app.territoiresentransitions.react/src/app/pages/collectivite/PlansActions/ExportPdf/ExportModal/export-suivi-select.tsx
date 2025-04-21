import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { OptionValue, SelectMultiple } from '@/ui';
import { TSectionsValues } from '../utils';

type Props = {
  options: TSectionsValues;
  setOptions: (values: TSectionsValues) => void;
};

const ExportSuiviSelect = ({ options, setOptions }: Props) => {
  const optionsList = [
    {
      value: 0,
      label: 'Toutes les années',
      disabled: options.notes_suivi.values?.includes(0),
    },
    ...getYearsOptions().yearsOptions,
  ];

  const handleOnChange = (values: OptionValue[] | undefined) => {
    const prevValues = options.notes_suivi.values;
    const isPrevSelectAll = prevValues?.includes(0) ?? false;

    const newValue = {
      ...options.notes_suivi,
      values: isPrevSelectAll
        ? (values?.filter((v) => v !== 0) as number[] | undefined)
        : values?.includes(0) || values === undefined || !values.length
        ? [0]
        : (values as number[]),
    };

    const newOptions = {
      ...options,
      notes_suivi: newValue,
    };

    setOptions(newOptions);
  };

  return (
    <SelectMultiple
      maxBadgesToShow={2}
      options={optionsList}
      values={options.notes_suivi.values}
      onChange={({ values }) => handleOnChange(values)}
      disabled={!options.notes_suivi.isChecked}
      small
    />
  );
};

export default ExportSuiviSelect;
