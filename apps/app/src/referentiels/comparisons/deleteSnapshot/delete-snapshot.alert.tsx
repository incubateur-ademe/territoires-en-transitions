import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
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

  return (
    <AlertModal
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
      size="md"
    >
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.supprimerSauvegarde}</AlertModal.Title>
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>
          {appLabels.supprimerSauvegardeDescription}
        </AlertModal.Description>
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          onClick={() =>
            deleteSnapshot({ collectiviteId, referentielId, snapshotRef })
          }
        >
          {appLabels.confirmer}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
