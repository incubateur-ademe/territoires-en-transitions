import ActionsGroupeesModale from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesModale';
import { FicheShareBulkEditorFormSection } from '@/app/plans/fiches/share-fiche/fiche-share-bulk-editor.form-section';
import { IdNameSchema } from '@/domain/collectivites';
import { BulkEditRequest } from '@/domain/plans/fiches';
import { Button } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';

type FicheAccessBulkEditorModalProps = {
  openState: OpenState;
  onUpdate: (input: Pick<BulkEditRequest, 'sharedWithCollectivites'>) => void;
};

const FicheAccessBulkEditorModal = ({
  openState,
  onUpdate,
}: FicheAccessBulkEditorModalProps) => {
  const [sharedCollectivitesToAdd, setSharedCollectivitesToAdd] = useState<
    IdNameSchema[]
  >([]);
  const [sharedCollectivitesToRemove, setSharedCollectivitesToRemove] =
    useState<IdNameSchema[]>([]);

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Gestion des droits d'accès"
      onSave={() => {
        onUpdate({
          sharedWithCollectivites: {
            add: sharedCollectivitesToAdd,
            remove: sharedCollectivitesToRemove,
          },
        });
      }}
    >
      <div className="col-span-2">
        <FicheShareBulkEditorFormSection
          collectivitesToAdd={sharedCollectivitesToAdd}
          onCollectivitesToAddChange={setSharedCollectivitesToAdd}
          collectivitesToRemove={sharedCollectivitesToRemove}
          onCollectivitesToRemoveChange={setSharedCollectivitesToRemove}
        />
      </div>
    </ActionsGroupeesModale>
  );
};

type FicheAccessBulkEditorModalButtonProps = {
  onUpdate: (input: Pick<BulkEditRequest, 'sharedWithCollectivites'>) => void;
};

export const FicheAccessBulkEditorModalButton = ({
  onUpdate,
}: FicheAccessBulkEditorModalButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outlined"
        icon="lock-line"
        size="xs"
        onClick={() => setIsModalOpen(true)}
      >
        Gestion des droits d&apos;accès
      </Button>
      {isModalOpen && (
        <FicheAccessBulkEditorModal
          openState={{ isOpen: isModalOpen, setIsOpen: setIsModalOpen }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};
