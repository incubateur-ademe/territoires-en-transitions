import { Option, SelectMultiple, SelectMultipleProps } from '@/ui';

type VersionsDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values: Array<string>;
  options: Array<Option>;
  onChange: ({
    snapshots,
    selectedSnapshot,
  }: {
    snapshots: Array<string>;
    selectedSnapshot: string;
  }) => void;
};

const VersionsDropdown = (props: VersionsDropdownProps) => {
  const values = props.values ?? [];

  return (
    <div>
      <label className="mb-2">Sélectionner les versions à afficher :</label>
      <SelectMultiple
        displayAllBadges
        dataTest="snapshots"
        options={props.options}
        placeholder={
          props.placeholder ?? 'Sélectionnez une ou plusieurs versions'
        }
        values={values}
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

export default VersionsDropdown;
