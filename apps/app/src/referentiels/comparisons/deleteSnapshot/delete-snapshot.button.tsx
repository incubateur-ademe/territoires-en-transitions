import { Icon } from '@tet/ui';
import { useState } from 'react';
import { DeleteSnapshotModal } from './delete-snapshot.modal';

type DeleteSnapshotButtonProps = {
  snapshotRef: string;
};

export const DeleteSnapshotButton = ({
  snapshotRef,
}: DeleteSnapshotButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        className="text-sm text-grey-8"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Icon icon="delete-bin-line" size="sm" className="mr-2" />
      </button>
      {isOpen && (
        <DeleteSnapshotModal
          snapshotRef={snapshotRef}
          openState={{
            isOpen,
            setIsOpen,
          }}
        />
      )}
    </>
  );
};
