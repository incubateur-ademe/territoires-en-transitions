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
   * Needed to always display a value in its right date order
   */
  const sortedValues = values
    .map((value) => props.options.find((opt) => opt.value === value))
    .filter((option): option is SnapshotOption => option !== undefined)
    .sort((a, b) => sortByDate(a.date, b.date))
    .map((option) => option.value);

  return (
    <SelectMultiple
      {...props}
      displayAllBadges
      options={props.options}
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
  );
};

export default SnapshotsDropdown;
