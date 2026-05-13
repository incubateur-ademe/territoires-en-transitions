import { appLabels } from '@/app/labels/catalog';
import { useDeleteFiche } from '@/app/plans/fiches/data/use-delete-fiche';
import { FicheWithRelations } from '@tet/domain/plans';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { OpenState } from '@tet/ui/utils/types';

type DeleteFicheModalProps = {
  sousAction: FicheWithRelations;
  openState: OpenState;
};

export const DeleteSousActionModal = ({
  sousAction,
  openState,
}: DeleteFicheModalProps) => {
  const { mutate: deleteFiche } = useDeleteFiche({});

  return (
    <AlertModal
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
    >
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.supprimerSousAction}</AlertModal.Title>
        {sousAction.titre && (
          <AlertModal.Subtitle>{sousAction.titre}</AlertModal.Subtitle>
        )}
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>
          {appLabels.confirmDeleteSousActionDescription}
        </AlertModal.Description>
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          onClick={() => deleteFiche({ ficheId: sousAction.id })}
        >
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
