import { appLabels } from '@/app/labels/catalog';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { Dispatch, SetStateAction } from 'react';
import { useRemoveInvitation } from './use-remove-invitation';

export type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  email: string;
};

export const ConfirmerSuppressionInvitation = (props: Props) => {
  const { isOpen, setIsOpen, email } = props;

  const { removeInvitation } = useRemoveInvitation();

  return (
    <AlertModal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }} size="md">
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.annulerInvitation}</AlertModal.Title>
        <AlertModal.Subtitle>{email}</AlertModal.Subtitle>
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>
          {appLabels.invitationDescription}
        </AlertModal.Description>
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action onClick={() => removeInvitation(email)}>
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
