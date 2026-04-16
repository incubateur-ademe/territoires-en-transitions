import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
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
            children: appLabels.confirmer,
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
      title={appLabels.supprimerSauvegarde}
      description={appLabels.supprimerSauvegardeDescription}
      state="info"
      className="mt-4 py-2"
    />
  );
};
