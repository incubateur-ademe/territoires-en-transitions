import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { appLabels } from '@/app/labels/catalog';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
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

  const title = isCurrentUser ? appLabels.retirerMonAcces : appLabels.retirerAcces;

  return (
    <AlertModal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }} size="md">
      <AlertModal.Header>
        <AlertModal.Title>{title}</AlertModal.Title>
        <AlertModal.Subtitle>{membre.email}</AlertModal.Subtitle>
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>{getDescription(props)}</AlertModal.Description>
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          onClick={() => removeMembre({ userId: membre.userId })}
        >
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};

const getDescription = ({ membre, isCurrentUser }: Props) => {
  if (isCurrentUser) {
    return appLabels.confirmRetirerMonAcces;
  }
  return appLabels.confirmRetirerAccesMembre({
    prenom: membre.prenom,
    nom: membre.nom,
  });
};
