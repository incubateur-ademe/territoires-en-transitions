import { OptionValue, SelectMultiple } from '@tet/ui';
import { getYearsOptions } from '@/app/utils/get-years-options';
import {
  ALL_YEARS_OPTION_KEY,
  NotesYearsSelection,
  TSectionsValues,
} from '../utils';

type Props = {
  options: TSectionsValues;
  setOptions: (values: TSectionsValues) => void;
};

const ExportSuiviSelect = ({ options, setOptions }: Props) => {
  const optionsList = [
    {
      value: ALL_YEARS_OPTION_KEY,
      label: 'Toutes les années',
      disabled: options.notes.values?.includes(ALL_YEARS_OPTION_KEY),
    },
    ...getYearsOptions().yearsOptions,
  ];

  const handleOnChange = (values: OptionValue[] | undefined) => {
    const prevValues = options.notes.values;
    const isPrevSelectAll =
      prevValues?.includes(ALL_YEARS_OPTION_KEY) ?? false;

    const newValue = {
      ...options.notes,
      values: isPrevSelectAll
        ? (values?.filter((v) => v !== ALL_YEARS_OPTION_KEY) as
            | NotesYearsSelection
            | undefined)
        : values?.includes(ALL_YEARS_OPTION_KEY) ||
          values === undefined ||
          !values.length
        ? [ALL_YEARS_OPTION_KEY]
        : (values as NotesYearsSelection),
    };

    const newOptions = {
      ...options,
      notes: newValue,
    };

    setOptions(newOptions);
  };

  return (
    <SelectMultiple
      maxBadgesToShow={2}
      options={optionsList}
      values={options.notes.values}
      onChange={({ values }) => handleOnChange(values)}
      disabled={!options.notes.isChecked}
      small
    />
  );
};

export default ExportSuiviSelect;
