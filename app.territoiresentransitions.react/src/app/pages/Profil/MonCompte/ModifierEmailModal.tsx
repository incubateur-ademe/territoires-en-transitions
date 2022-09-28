import {Dispatch, SetStateAction, SyntheticEvent} from 'react';

import Modal from 'ui/shared/floating-ui/Modal';
import {useUpdateEmail} from 'core-logic/api/auth/useUpdateEmail';

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
  const {handleUpdateEmail} = useUpdateEmail();

  const handleAnnuler = () => {
    setOpen(false);
    resetEmail();
  };

  return (
    <Modal
      size="lg"
      externalOpen={isOpen}
      setExternalOpen={handleAnnuler}
      render={({labelId, descriptionId}) => (
        <div data-test="modification-email-modal">
          <h4 id={labelId} className="fr-h4">
            Modifier mon adresse email
          </h4>
          <p id={descriptionId}>
            Cette modification sera effective quand vous aurez cliqué sur le
            lien de validation du message envoyé à la nouvelle adresse associée
            à votre compte <span className="font-bold">{email}</span>
          </p>
          <div className="mt-2 fr-btns-group fr-btns-group--left fr-btns-group--inline-reverse fr-btns-group--inline-lg">
            <button
              onClick={handleAnnuler}
              className="fr-btn fr-btn--secondary"
              aria-label="Annuler"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                handleUpdateEmail({email: email});
                setOpen(false);
              }}
              aria-label="Confirmer"
              className="fr-btn"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    />
  );
};

export default ModifierEmailModal;
