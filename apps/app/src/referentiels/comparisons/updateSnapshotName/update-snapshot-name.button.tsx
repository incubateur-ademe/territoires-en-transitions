import { Button } from '@tet/ui';
import { useState } from 'react';
import { UpdateSnapshotNameModal } from './update-snapshot-name.modal';
import { RiEditLine } from '@remixicon/react';

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
      <Button
        variant="white"
        size="xs"
        icon={<RiEditLine />}
        className="p-0.5"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      />
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
