import { DeleteSnapshotButton } from '@/app/referentiels/comparisons/deleteSnapshot/delete-snapshot.button';
import { UpdateSnapshotNameButton } from '@/app/referentiels/comparisons/updateSnapshotName/update-snapshot-name.button';
import { RouterOutput } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { SnapshotJalonEnum } from '@tet/domain/referentiels';
import { Icon, SelectMultiple, SelectMultipleProps } from '@tet/ui';

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
  maxBadgesToShow: number;
};

const checkNonEditable = (snapshotRef: string, options: SnapshotOption[]) => {
  const jalon = getSnapshotJalonFromRef(snapshotRef, options);
  return jalon !== SnapshotJalonEnum.DATE_PERSONNALISEE;
};

const getSnapshotJalonFromRef = (
  ref: string,
  options: SnapshotOption[]
): SnapshotJalon | undefined => {
  return options?.find((option) => option.ref === ref)?.jalon;
};

export function EvolutionsSnapshotsDropdown<T extends SnapshotOption>({
  values = [],
  options,
  onChange,
  maxBadgesToShow,
  ...props
}: SnapshotsDropdownProps<T>) {
  const { isReadOnly } = useCurrentCollectivite();

  const renderOptionWithIcons = (option: any) => {
    const isActive = values.some((v) => v.ref === option.value);
    const isNonEditable = checkNonEditable(option.value, options);
    const isEditable = !isNonEditable && !isReadOnly;

    return (
      <div className="flex items-center justify-between w-full">
        {isNonEditable && (
          <Icon icon="star-s-fill" size="sm" className="text-red-500 mr-2" />
        )}
        <span className={`mr-8 ${isActive ? 'text-primary-7' : 'text-grey-8'}`}>
          {option.label}
        </span>
        {isEditable && (
          <>
            <UpdateSnapshotNameButton
              snapshotRef={option.value}
              snapshotName={option.label}
            />
            <DeleteSnapshotButton snapshotRef={option.value} />
          </>
        )}
      </div>
    );
  };

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
        const selectedSnapshots = options.filter((option) =>
          values?.includes(option.ref)
        );
        onChange(selectedSnapshots);
      }}
      customItem={(option) => {
        return renderOptionWithIcons(option);
      }}
      showCustomItemInBadges={false}
    />
  );
}
