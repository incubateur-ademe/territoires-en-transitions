import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { Dispatch, SetStateAction } from 'react';
import { useRemoveMembre } from './use-remove-membre';

export type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  membre: Membre;
  isCurrentUser: boolean;
};

/**
 * Confirmation avant de retirer un membre de la collectivité.
 */
export const ConfirmerSuppressionMembre = (props: Props) => {
  const { isOpen, setIsOpen, membre, isCurrentUser } = props;

  const { mutateAsync: removeMembre } = useRemoveMembre();

  return (
    <Modal
      size="md"
      title={
        isCurrentUser
          ? 'Retirer mon accès la collectivité'
          : "Retirer l'accès à la collectivité"
      }
      subTitle={membre.email}
      description={getDescription(props)}
      openState={{ isOpen, setIsOpen }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              removeMembre({ userId: membre.userId });
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
  return `Voulez-vous retirer l'accès à votre collectivité à ${membre.prenom} ${membre.nom}?`;
};
