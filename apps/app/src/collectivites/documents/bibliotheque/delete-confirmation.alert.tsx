import { Modal, ModalFooterOKCancel } from '@tet/ui';

type DeleteConfirmationAlertProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: string;
  message?: string;
  onDelete: () => void;
};

export const DeleteConfirmationAlert = ({
  isOpen,
  setIsOpen,
  title,
  message,
  onDelete,
}: DeleteConfirmationAlertProps) => {
  return (
    isOpen && (
      <Modal
        openState={{ isOpen, setIsOpen }}
        title={title}
        dataTest="confirm-suppr"
        render={message ? () => <p className="mb-0">{message}</p> : undefined}
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close }}
            btnOKProps={{
              onClick: () => {
                onDelete();
                close();
              },
            }}
          />
        )}
      />
    )
  );
};
