import { Icon, SelectMultiple, SelectMultipleProps } from '@/ui';
import { useCurrentCollectivite } from '../../core-logic/hooks/useCurrentCollectivite';
import { DeleteSnapshotButton } from './deleteSnapshot/delete-snapshot.button';
import { UpdateSnapshotNameButton } from './updateSnapshotName/update-snapshot-name.button';

export type SnapshotOption = {
  ref: string;
  nom: string;
  date: string;
  jalon?: string;
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

  // Snapshots with jalon post-audit
  const AUDIT_JALON = 'post_audit';

  // Snapshots with references like "2024-labellisation-EMT" are non editable
  // TODO: replace with jalon check when labellisation jalons will be implemented
  const LABELLISATION_REF = /^\d{4}-labellisation-EMT$/;

  return jalon === AUDIT_JALON || LABELLISATION_REF.test(snapshotRef);
};

const getSnapshotJalonFromRef = (ref: string, options: SnapshotOption[]) => {
  return options?.find((option) => option.ref === ref)?.jalon;
};

export function SnapshotsDropdown<T extends SnapshotOption>({
  values = [],
  options,
  onChange,
  maxBadgesToShow,
  ...props
}: SnapshotsDropdownProps<T>) {
  const { isReadOnly } = useCurrentCollectivite()!;

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
