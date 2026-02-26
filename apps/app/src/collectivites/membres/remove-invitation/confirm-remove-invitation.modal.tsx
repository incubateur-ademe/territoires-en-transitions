import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { Dispatch, SetStateAction } from 'react';
import { useRemoveInvitation } from './use-remove-invitation';

export type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  email: string;
};

/**
 * Confirmation avant d'annuler une invitation en attente.
 */
export const ConfirmerSuppressionInvitation = (props: Props) => {
  const { isOpen, setIsOpen, email } = props;

  const { removeInvitation } = useRemoveInvitation();

  return (
    <Modal
      size="md"
      title="Annuler l'invitation"
      subTitle={email}
      description="Cette personne n'a pas encore créé de compte. Même si elle le fait, elle ne pourra pas contribuer dans l'espace de la collectivité."
      openState={{ isOpen, setIsOpen }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              removeInvitation(email);
              close();
            },
          }}
          btnCancelProps={{ onClick: () => close() }}
        />
      )}
    />
  );
};
