import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState, type JSX } from 'react';

type Props = {
  label: string;
  onDismissConfirm: (isConfirmed: boolean) => void;
};

export const ConfirmDetachSousIndicateur = ({
  label,
  onDismissConfirm,
}: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Modal
      disableDismiss
      noCloseButton
      size="lg"
      title={appLabels.indicateurSousIndicateurDissocier({ label })}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <p className="text-center mb-0">
          {appLabels.indicateurSousIndicateurDissocierInfo}
        </p>
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
