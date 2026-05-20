import { appLabels } from '@/app/labels/catalog';
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
          <h4 className="mb-0">{appLabels.cguMiseAJourTitre} </h4>
          <p className="mb-0">{appLabels.cguAccepterMessage}</p>
        </>
      )}
      renderFooter={() => (
        <ModalFooter>
          <Button href={CGU_URL} external variant="underlined" className="mr-4">
            {appLabels.cguLireConditionsGenerales}
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
            {appLabels.cguAccepterEtPoursuivre}
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
