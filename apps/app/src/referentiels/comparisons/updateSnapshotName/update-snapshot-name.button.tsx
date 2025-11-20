import { Icon } from '@tet/ui';
import { useState } from 'react';
import { UpdateSnapshotNameModal } from './update-snapshot-name.modal';

type UpdateSnapshotNameButtonProps = {
  snapshotRef: string;
  snapshotName: string;
};

export const UpdateSnapshotNameButton = ({
  snapshotName,
  snapshotRef,
}: UpdateSnapshotNameButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        className="text-sm text-grey-8"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Icon icon="edit-line" size="sm" className="mr-2" />
      </button>
      {isOpen && (
        <UpdateSnapshotNameModal
          openState={{
            isOpen,
            setIsOpen,
          }}
          snapshotName={snapshotName}
          snapshotRef={snapshotRef}
        />
      )}
    </>
  );
};
