import { OptionValue, SelectMultiple } from '@/ui';
import { getYearsOptions } from '../../FicheAction/NotesDeSuivi/ModaleCreationNote';
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
      disabled: options.suivi.values?.includes(0),
    },
    ...getYearsOptions().yearsOptions,
  ];

  const handleOnChange = (values: OptionValue[] | undefined) => {
    const prevValues = options.suivi.values;
    const isPrevSelectAll = prevValues?.includes(0) ?? false;

    const newValue = {
      ...options.suivi,
      values: isPrevSelectAll
        ? (values?.filter((v) => v !== 0) as number[] | undefined)
        : values?.includes(0) || values === undefined || !values.length
        ? [0]
        : (values as number[]),
    };

    const newOptions = {
      ...options,
      suivi: newValue,
    };

    setOptions(newOptions);
  };

  return (
    <SelectMultiple
      maxBadgesToShow={2}
      options={optionsList}
      values={options.suivi.values}
      onChange={({ values }) => handleOnChange(values)}
      disabled={!options.suivi.isChecked}
      small
    />
  );
};

export default ExportSuiviSelect;
