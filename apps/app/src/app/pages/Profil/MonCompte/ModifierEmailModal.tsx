import { Dispatch, SetStateAction, SyntheticEvent } from 'react';

import { useUpdateEmail } from '@/app/users/use-update-email';
import { Modal, ModalFooterOKCancel } from '@/ui';

type ModifierEmailModalProps = {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  resetEmail: (e?: SyntheticEvent) => void;
  email: string;
};

const ModifierEmailModal = ({
  isOpen,
  setOpen,
  email,
  resetEmail,
}: ModifierEmailModalProps) => {
  const { handleUpdateEmail } = useUpdateEmail();

  return (
    <Modal
      dataTest="modification-email-modal"
      openState={{ isOpen, setIsOpen: setOpen }}
      title="Modifier mon adresse email"
      render={({ descriptionId }) => (
        <p id={descriptionId} className="mb-0 text-center">
          Cette modification sera effective quand vous aurez cliqué sur le lien
          de validation du message envoyé à la nouvelle adresse associée à votre
          compte <span className="font-bold">{email}</span>
        </p>
      )}
      renderFooter={() => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => {
              setOpen(false);
              resetEmail();
            },
            'aria-label': 'Annuler',
          }}
          btnOKProps={{
            children: 'Confirmer',
            onClick: () => {
              handleUpdateEmail({ email: email });
              setOpen(false);
            },
            'aria-label': 'Confirmer',
          }}
        />
      )}
    />
  );
};

export default ModifierEmailModal;
