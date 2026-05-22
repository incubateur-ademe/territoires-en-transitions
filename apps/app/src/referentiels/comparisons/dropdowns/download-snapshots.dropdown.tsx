import { RouterOutput } from '@tet/api';
import { SnapshotJalonEnum } from '@tet/domain/referentiels';
import { SelectMultiple, SelectMultipleProps } from '@tet/ui';

type SnapshotJalon =
  RouterOutput['referentiels']['snapshots']['updateName'][number]['jalon'];

export type SnapshotOption = {
  ref: string;
  nom: string;
  date: string;
  jalon?: SnapshotJalon;
};

type SnapshotsDropdownProps<T extends SnapshotOption> = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values: T[];
  options: T[];
  onChange: (selectedSnapshots: T[]) => void;
  maxSelection: number;
};

const getSnapshotJalonFromRef = (
  ref: string,
  options: SnapshotOption[]
): SnapshotJalon | undefined => {
  return options?.find((option) => option.ref === ref)?.jalon;
};

const isDownloadable = (snapshotRef: string, options: SnapshotOption[]) => {
  const jalon = getSnapshotJalonFromRef(snapshotRef, options);
  return jalon !== SnapshotJalonEnum.LABELLISATION_EMT;
};

export function DownloadSnapshotsDropdown<T extends SnapshotOption>({
  values = [],
  options,
  onChange,
  maxSelection,
  ...props
}: SnapshotsDropdownProps<T>) {
  const isMaxSelectionReached = values.length >= maxSelection;

  const isOptionAlreadySelected = (option: T) =>
    values.some((v) => v.ref === option.ref);

  return (
    <SelectMultiple
      {...props}
      enableDisplayLimitValue={false}
      options={options
        .filter((option) => isDownloadable(option.ref, options))
        .map((option) => ({
          value: option.ref,
          label: option.nom,
          disabled: isMaxSelectionReached && !isOptionAlreadySelected(option),
        }))}
      placeholder={
        props.placeholder ?? `Sélectionnez une ou ${maxSelection} versions`
      }
      values={values.map((value) => value.ref)}
      onChange={({ values }) => {
        const selectedSnapshots = options.filter((option) =>
          values?.includes(option.ref)
        );
        onChange(selectedSnapshots);
      }}
    />
  );
}
