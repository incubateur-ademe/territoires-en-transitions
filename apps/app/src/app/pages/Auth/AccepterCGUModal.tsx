import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { Button, CGU_URL, Modal, ModalFooter } from '@/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { mutate, isPending } = useAccepterCGU();
  const user = useUser();
  if (!user || user.cgu_acceptees_le) {
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
              mutate();
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
  const user = useUser();
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async () => user.id && supabase.rpc('accepter_cgu'),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dcp', user.id],
      });
    },
  });
};
