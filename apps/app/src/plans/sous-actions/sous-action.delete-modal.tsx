import { useDeleteFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-delete-fiche';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type DeleteFicheModalProps = {
  id: number;
  openState: OpenState;
};

export const SousActionDeleteModal = ({
  id,
  openState,
}: DeleteFicheModalProps) => {
  const { mutate: deleteFiche } = useDeleteFiche({});

  return (
    <Modal
      openState={openState}
      title="Supprimer la sous-action"
      render={({ descriptionId }) => (
        <div id={descriptionId} className="text-center">
          Êtes-vous sûr de vouloir supprimer cette sous-action ?
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              deleteFiche({ ficheId: id });
              close();
            },
          }}
        />
      )}
    />
  );
};
