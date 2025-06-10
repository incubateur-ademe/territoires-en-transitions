import ActionsGroupeesModale from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/ActionsGroupeesModale';
import { useFichesActionsBulkEdit } from '@/app/app/pages/collectivite/PlansActions/ActionsGroupees/useFichesActionsBulkEdit';
import { FicheShareBulkEditorFormSection } from '@/app/plans/fiches/share-fiche/fiche-share-bulk-editor.form-section';
import { useShareFicheEnabled } from '@/app/plans/fiches/share-fiche/use-share-fiche-enabled';
import { IdNameSchema } from '@/domain/collectivites';
import { Button, Event, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';

type FicheAccessBulkEditorModalProps = {
  openState: OpenState;
  selectedIds: number[];
};

const FicheAccessBulkEditorModal = ({
  openState,
  selectedIds,
}: FicheAccessBulkEditorModalProps) => {
  const [editedRestreint, setEditedRestreint] = useState<boolean | undefined>(
    undefined
  );
  const [sharedCollectivitesToAdd, setSharedCollectivitesToAdd] = useState<
    IdNameSchema[]
  >([]);
  const [sharedCollectivitesToRemove, setSharedCollectivitesToRemove] =
    useState<IdNameSchema[]>([]);

  const tracker = useEventTracker();

  const mutation = useFichesActionsBulkEdit();

  return (
    <ActionsGroupeesModale
      openState={openState}
      title="Gestion des droits d'accès"
      actionsCount={selectedIds.length}
      onSave={() => {
        tracker(Event.fiches.updateAccesGroupe);
        mutation.mutate({
          ficheIds: selectedIds,

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
  selectedIds: number[];
};

export const FicheAccessBulkEditorModalButton = ({
  selectedIds,
}: FicheAccessBulkEditorModalButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const shareFicheFlagEnabled = useShareFicheEnabled();

  if (!shareFicheFlagEnabled) {
    return null;
  }

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
          selectedIds={selectedIds}
        />
      )}
    </>
  );
};
