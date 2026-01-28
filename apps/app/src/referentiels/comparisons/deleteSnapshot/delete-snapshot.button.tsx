import { Button } from '@tet/ui';
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
      <Button
        variant="white"
        size="xs"
        icon="delete-bin-line"
        className="p-0.5"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      />
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
