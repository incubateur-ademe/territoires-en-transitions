import { OptionValue, SelectMultiple } from '@tet/ui';
import { getYearsOptions } from '@/app/utils/get-years-options';
import {
  ALL_YEARS_OPTION_KEY,
  NotesYearsSelection,
  TSectionsValues,
} from '../utils';

type NotesYearsOption = typeof ALL_YEARS_OPTION_KEY | number;

const isNotesYearsOption = (value: OptionValue): value is NotesYearsOption =>
  value === ALL_YEARS_OPTION_KEY || typeof value === 'number';

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

    const typedValues: NotesYearsSelection | undefined =
      values?.filter(isNotesYearsOption);

    const newValue = {
      ...options.notes,
      values: isPrevSelectAll
        ? typedValues?.filter((v) => v !== ALL_YEARS_OPTION_KEY)
        : !typedValues?.length || typedValues.includes(ALL_YEARS_OPTION_KEY)
        ? [ALL_YEARS_OPTION_KEY]
        : typedValues,
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
