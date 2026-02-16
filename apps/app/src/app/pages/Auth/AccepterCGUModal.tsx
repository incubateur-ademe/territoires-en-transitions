import { useUpdateUser } from '@/app/users/use-update-user';
import { useMutation } from '@tanstack/react-query';
import { useUser } from '@tet/api';
import { Button, CGU_URL, Modal, ModalFooter } from '@tet/ui';
import { useState } from 'react';
import ContractSVG from './contract.svg';

export type TAccepterCGUProps = {
  isLoading?: boolean;
  onOK: () => void;
};

/**
 * Affiche la modale d'acceptation des CGU lorsque c'est nécessaire
 */
const AccepterCGUModal = () => {
  const [opened, setOpened] = useState(true);
  const { mutate: acceptCgu, isPending } = useAccepterCGU();
  const user = useUser();
  if (!user || user.cguAccepteesLe) {
    return null;
  }

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      disableDismiss
      noCloseButton
      dataTest="AccepterCGU"
      render={() => (
        <>
          <ContractSVG className="self-center" />
          <h4 className="mb-0">
            Mise à jour des conditions générales d’utilisation{' '}
          </h4>
          <p className="mb-0">
            Pour continuer à utiliser la plateforme territoiresentransitions.fr,
            nous vous invitons à accepter les conditions générales
            d’utilisation.
          </p>
        </>
      )}
      renderFooter={() => (
        <ModalFooter>
          <Button href={CGU_URL} external variant="underlined" className="mr-4">
            Lire les conditions générales
          </Button>
          <Button
            data-test="AccepterCGUBtn"
            icon="arrow-right-line"
            iconPosition="right"
            disabled={isPending}
            onClick={() => {
              acceptCgu();
              setOpened(false);
            }}
          >
            Accepter et poursuivre
          </Button>
        </ModalFooter>
      )}
    />
  );
};

export default AccepterCGUModal;

// enregistre l'acceptation des CGU
const useAccepterCGU = () => {
  const { mutateAsync: updateUser } = useUpdateUser();

  return useMutation({
    mutationFn: async () => {
      await updateUser({ hasAcceptedCGU: true });
    },
  });
};
