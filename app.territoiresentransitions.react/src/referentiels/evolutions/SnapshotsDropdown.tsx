import { SelectMultiple, SelectMultipleProps } from '@/ui';
import { sortByDate } from './utils';

export type SnapshotOption = {
  value: string;
  label: string;
  date: string;
};

type SnapshotsDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values: Array<string>;
  options: Array<SnapshotOption>;
  onChange: ({
    snapshots,
    selectedSnapshot,
  }: {
    snapshots: Array<string>;
    selectedSnapshot: string;
  }) => void;
};

const SnapshotsDropdown = (props: SnapshotsDropdownProps) => {
  const values = props.values ?? [];

  /**
   * Needed to display options and values sorted by date
   */
  const sortedOptions = sortOptions(props.options);
  const sortedValues = sortValues(values, sortedOptions);

  return (
    <div>
      <label className="mb-2">Sélectionner les versions à afficher :</label>
      <SelectMultiple
        {...props}
        displayAllBadges
        options={sortedOptions}
        placeholder={
          props.placeholder ?? 'Sélectionnez une ou plusieurs versions'
        }
        values={sortedValues}
        onChange={({ values, selectedValue }) => {
          props.onChange({
            snapshots: values as string[],
            selectedSnapshot: selectedValue as string,
          });
        }}
      />
    </div>
  );
};

const sortOptions = (options: SnapshotOption[], ascending = true) => {
  return [...options].sort((a, b) => sortByDate(a.date, b.date, ascending));
};

const matchSelectedOptionsWithValues = (
  values: string[],
  options: SnapshotOption[]
): SnapshotOption[] => {
  const matchedOptions = values.map((selectedValue) => {
    return options.find((option) => option.value === selectedValue);
  });

  const optionsWithoutUndefined = matchedOptions.filter(
    (option): option is SnapshotOption => option !== undefined
  );

  return optionsWithoutUndefined;
};

const sortValues = (values: string[], options: SnapshotOption[]): string[] => {
  const selectedSnapshotOptions = matchSelectedOptionsWithValues(
    values,
    options
  );
  return sortOptions(selectedSnapshotOptions).map((option) => option.value);
};

export default SnapshotsDropdown;
