import { CollectiviteMembre } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { Dispatch, SetStateAction } from 'react';
import { Membre } from '../../../../../../../src/app/pages/collectivite/Users/types';
import { useRemoveFromCollectivite } from '../../../../../../../src/app/pages/collectivite/Users/useRemoveFromCollectivite';

export type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  membre: CollectiviteMembre;
  isCurrentUser: boolean;
};

/**
 * Confirmation avant de supprimer un membre de la collectivité.
 */
export const ConfirmerSuppressionMembre = (props: Props) => {
  const { isOpen, setIsOpen, membre, isCurrentUser } = props;

  const { removeFromCollectivite } = useRemoveFromCollectivite();

  return (
    <Modal
      size="md"
      title={
        isCurrentUser
          ? 'Retirer mon accès la collectivité'
          : membre.user_id
          ? "Retirer l'accès à la collectivité"
          : "Annuler l'invitation"
      }
      subTitle={membre.email}
      description={getDescription(props)}
      openState={{ isOpen, setIsOpen }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              removeFromCollectivite(membre);
              close();
            },
          }}
          btnCancelProps={{ onClick: () => close() }}
        />
      )}
    />
  );
};

const getDescription = ({ membre, isCurrentUser }: Props) => {
  if (isCurrentUser) {
    return 'Souhaitez-vous vraiment ne plus avoir un accès privilégié au profil de cette collectivité ?';
  }

  if (membre?.user_id) {
    return `Voulez-vous retirer l'accès à votre collectivité à ${membre.prenom} ${membre.nom}?`;
  }
  return "Cette personne n'a pas encore créé de compte. Même si elle le fait, elle ne pourra pas contribuer dans l'espace de la collectivité.";
};
