import { appLabels } from '@/app/labels/catalog';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState, type JSX } from 'react';

type Props = {
  titre: string;
  onDismissConfirm: (isConfirmed: boolean) => void;
};

export const ConfirmChangeUnite = ({
  titre,
  onDismissConfirm,
}: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Modal
      disableDismiss
      noCloseButton
      size="lg"
      title={appLabels.indicateurUniteChangementTitre}
      subTitle={titre}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <Alert
          state="warning"
          title={appLabels.indicateurUniteChangementSousIndicateursTitre}
          description={
            appLabels.indicateurUniteChangementSousIndicateursDescription
          }
        />
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            children: appLabels.confirmer,
            onClick: () => {
              onDismissConfirm(true);
              close();
            },
          }}
          btnCancelProps={{
            onClick: () => {
              onDismissConfirm(false);
              close();
            },
          }}
        />
      )}
    />
  );
};
