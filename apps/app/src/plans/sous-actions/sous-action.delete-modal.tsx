import { useDeleteFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-delete-fiche';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type DeleteFicheModalProps = {
  sousAction: FicheWithRelations;
  openState: OpenState;
};

export const SousActionDeleteModal = ({
  sousAction,
  openState,
}: DeleteFicheModalProps) => {
  const { mutate: deleteFiche } = useDeleteFiche({});

  return (
    <Modal
      openState={openState}
      title="Supprimer la sous-action"
      subTitle={sousAction.titre ?? undefined}
      render={({ descriptionId }) => (
        <div id={descriptionId} className="flex flex-col gap-6 text-center">
          Êtes-vous sûr de vouloir supprimer cette sous-action ?
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              deleteFiche({ ficheId: sousAction.id });
              close();
            },
          }}
        />
      )}
    />
  );
};
