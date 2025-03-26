import { Icon, SelectMultiple, SelectMultipleProps } from '@/ui';
import { useCurrentCollectivite } from '../../core-logic/hooks/useCurrentCollectivite';
import { DeleteSnapshotButton } from './deleteSnapshot/delete-snapshot.button';
import { UpdateSnapshotNameButton } from './updateSnapshotName/update-snapshot-name.button';

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

const checkAudit = (snapshotRef: string) => {
  const AUDIT_SNAPSHOT_REGEX = /^\d{4}-audit$/;
  return AUDIT_SNAPSHOT_REGEX.test(snapshotRef);
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
    const isAuditSnapshot = checkAudit(option.value);

    return (
      <div className="flex items-center justify-between w-full">
        {isAuditSnapshot && (
          <Icon icon="star-s-fill" size="sm" className="text-red-500 mr-2" />
        )}
        <span className={`mr-8 ${isActive ? 'text-primary-7' : 'text-grey-8'}`}>
          {option.label}
        </span>
        {!isAuditSnapshot && !isReadOnly && (
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
