import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  titre: string;
  openState: OpenState;
  onConfirm: () => void;
};

export const DeleteIndicateurConfirmationModal = ({
  titre,
  openState,
  onConfirm,
}: Props) => (
  <Modal
    openState={openState}
    title={appLabels.suppressionIndicateur}
    subTitle={titre}
    render={() => (
      <p className="mb-0">{appLabels.suppressionIndicateurDescription}</p>
    )}
    renderFooter={({ close }) => (
      <ModalFooterOKCancel
        btnCancelProps={{
          onClick: () => close(),
        }}
        btnOKProps={{
          'aria-label': appLabels.supprimer,
          children: appLabels.supprimer,
          onClick: () => {
            onConfirm();
            close();
          },
        }}
      />
    )}
  />
);
