import { supabaseClient } from '@/api/utils/supabase/browser-client';
import Modal from '@/app/ui/shared/floating-ui/Modal';
import { useUser } from '@/app/users/user-provider';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { ReactComponent as ContractSVG } from './contract.svg';

export type TAccepterCGUProps = {
  isLoading?: boolean;
  onOK: () => void;
};

/**
 * Affiche le contenu de la modale d'acceptation des CGU
 */
export const AccepterCGUContent = (props: TAccepterCGUProps) => {
  const { isLoading, onOK } = props;
  return (
    <div className="fr-mb-4w" data-test="AccepterCGU">
      <div className="flex flex-col fr-mb-2w">
        <ContractSVG className="self-center" />
      </div>
      <h4>Mise à jour des conditions générales d’utilisation </h4>
      <p>
        Pour continuer à utiliser la plateforme territoiresentransitions.fr,
        nous vous invitons à accepter les conditions générales d’utilisation.
      </p>
      <p>
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="text-bf500"
          href="https://territoiresentransitions.fr/cgu"
        >
          Lire les conditions générales
        </a>
      </p>
      <button
        className="fr-btn fr-btn--icon-right fr-fi-arrow-right-line"
        data-test="AccepterCGUBtn"
        disabled={isLoading}
        onClick={onOK}
      >
        Accepter et poursuivre
      </button>
    </div>
  );
};

/**
 * Affiche la modale d'acceptation des CGU lorsque c'est nécessaire
 */
const AccepterCGUModal = () => {
  const [opened, setOpened] = useState(true);
  const { mutate, isLoading } = useAccepterCGU();
  const user = useUser();
  if (!user || user.cgu_acceptees_le) {
    return null;
  }

  const accepterCGU = () => {
    mutate();
    setOpened(false);
  };

  return (
    <Modal
      size="lg"
      externalOpen={opened}
      disableDismiss
      noCloseButton
      render={() => (
        <AccepterCGUContent onOK={accepterCGU} isLoading={isLoading} />
      )}
    />
  );
};

export default AccepterCGUModal;

// enregistre l'acceptation des CGU
const useAccepterCGU = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation(
    async () => user?.id && supabaseClient.rpc('accepter_cgu'),
    {
      mutationKey: 'accepter_cgu',
      onSuccess: () => {
        queryClient.invalidateQueries(['dcp', user!.id]);
      },
    }
  );
};
