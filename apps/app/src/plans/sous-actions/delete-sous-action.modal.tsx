import { appLabels } from '@/app/labels/catalog';
import { useDeleteFiche } from '@/app/plans/fiches/data/use-delete-fiche';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
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
    <Modal
      openState={openState}
      title={appLabels.supprimerSousAction}
      subTitle={sousAction.titre ?? undefined}
      render={({ descriptionId }) => (
        <div id={descriptionId} className="flex flex-col gap-6 text-center">
          {appLabels.confirmDeleteSousActionDescription}
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
