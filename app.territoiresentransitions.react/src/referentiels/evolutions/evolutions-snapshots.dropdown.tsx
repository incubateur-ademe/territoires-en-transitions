import { SelectMultiple, SelectMultipleProps } from '@/ui';

export type SnapshotOption = {
  ref: string;
  nom: string;
  date: string;
};

type SnapshotsDropdownProps<T extends SnapshotOption> = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values: T[];
  options: T[];
  onChange: (selectedSnapshots: T[]) => void;
  maxBadgesToShow: number;
};

export function SnapshotsDropdown<T extends SnapshotOption>({ values = [], options, onChange, maxBadgesToShow, ...props }: SnapshotsDropdownProps<T>) {

  return (
    <SelectMultiple
      {...props}
      maxBadgesToShow={maxBadgesToShow}
      options={options.map((option) => ({
        value: option.ref,
        label: option.nom,
      }))}
      placeholder={
        props.placeholder ?? 'Sélectionnez une ou plusieurs versions'
      }
      values={values.map((value) => value.ref)}
      onChange={({ values }) => {
        const selectedSnapshots = options.filter((option) => values?.includes(option.ref));
        onChange(selectedSnapshots);
      }}
    />
  );
};
