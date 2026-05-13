import { appLabels } from '@/app/labels/catalog';
import { useUpdateUser } from '@/app/users/use-update-user';
import { useMutation } from '@tanstack/react-query';
import { useUser } from '@tet/api';
import { Button, CGU_URL } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import ContractSVG from './contract.svg';

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
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      size="lg"
      dismissable={false}
    >
      <Modal.Header>
        <Modal.Title>{appLabels.cguMiseAJourTitre}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ContractSVG className="self-center" />
        <Modal.Description>{appLabels.cguMiseAJourMessage}</Modal.Description>
      </Modal.Body>
      <Modal.Footer>
        <Button href={CGU_URL} external variant="underlined" className="mr-4">
          {appLabels.cguLireConditions}
        </Button>
        <Modal.Ok
          icon="arrow-right-line"
          iconPosition="right"
          pending={isPending}
          onClick={() => {
            acceptCgu();
            setOpened(false);
          }}
        >
          {appLabels.cguAccepterEtPoursuivre}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};

export default AccepterCGUModal;

const useAccepterCGU = () => {
  const { mutateAsync: updateUser } = useUpdateUser();

  return useMutation({
    mutationFn: async () => {
      await updateUser({ hasAcceptedCGU: true });
    },
  });
};
