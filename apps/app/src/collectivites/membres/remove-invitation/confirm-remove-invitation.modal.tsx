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
      size="sm"
      title={appLabels.annulerInvitation}
      subTitle={email}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <p className="mb-0">{appLabels.invitationDescription}</p>
      )}
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
