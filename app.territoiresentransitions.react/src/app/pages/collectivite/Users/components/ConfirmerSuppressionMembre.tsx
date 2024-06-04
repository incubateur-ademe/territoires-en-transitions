import {Dispatch, SetStateAction} from 'react';
import {Modal, ModalFooterOKCancel} from '@tet/ui';
import {Membre, TRemoveFromCollectivite} from '../types';

export type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  membre: Membre;
  isCurrentUser: boolean;
  removeFromCollectivite: TRemoveFromCollectivite;
};

/**
 * Confirmation avant de supprimer un membre de la collectivité.
 */
export const ConfirmerSuppressionMembre = (props: Props) => {
  const {isOpen, setIsOpen, membre, isCurrentUser, removeFromCollectivite} =
    props;

  return (
    <Modal
      size="md"
      title={
        isCurrentUser
          ? 'Retirer mon accès la collectivité'
          : `Détacher ${membre.email}`
      }
      description={getDescription(props)}
      openState={{isOpen, setIsOpen}}
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              removeFromCollectivite(membre.email);
              close();
            },
          }}
          btnCancelProps={{onClick: () => close()}}
        />
      )}
    />
  );
};

const getDescription = ({membre, isCurrentUser}: Props) => {
  if (isCurrentUser) {
    return 'Souhaitez-vous vraiment ne plus avoir un accès privilégié au profil de cette collectivité ?';
  }

  if (membre?.user_id) {
    return `Voulez-vous retirer l’accès à votre collectivité à ${membre.prenom} ${membre.nom}?`;
  }
  return 'Cette personne n’a pas encore créé de compte. Même si elle le fait, elle ne pourra pas contribuer dans l’espace de la collectivité.';
};
