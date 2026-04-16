import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
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
    <Modal
      size="md"
      title={appLabels.annulerInvitation}
      subTitle={email}
      description={appLabels.invitationDescription}
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
