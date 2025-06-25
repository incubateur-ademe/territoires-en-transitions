import { useCollectiviteId } from '@/api/collectivites';
import { Alert, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useReferentielId } from '../../referentiel-context';
import { useSnapshotDelete } from '../../use-snapshot';

export const DeleteSnapshotModal = ({
  snapshotRef,
  openState,
}: {
  snapshotRef: string;
  openState: OpenState;
}) => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  const { mutate: deleteSnapshot } = useSnapshotDelete();

  const handleDeleteSnapshot = (snapshotRef: string) => {
    deleteSnapshot({
      collectiviteId,
      referentielId,
      snapshotRef,
    });
  };

  return (
    <Modal
      size="md"
      openState={openState}
      render={() => <DeleteSnapshotModalContent />}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: 'Confirmer',
            onClick: () => {
              handleDeleteSnapshot(snapshotRef);
              close();
            },
            variant: 'primary',
          }}
        />
      )}
    />
  );
};

export const DeleteSnapshotModalContent = () => {
  return (
    <Alert
      title="Supprimer une sauvegarde figée du référentiel"
      description="Cette sauvegarde sera définitivement supprimée. Êtes-vous sûr de vouloir supprimer cette sauvegarde du référentiel ?"
      state="info"
      className="mt-4 py-2"
    />
  );
};
