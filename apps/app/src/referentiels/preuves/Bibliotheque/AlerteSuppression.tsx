import { Modal, ModalFooterOKCancel } from '@tet/ui';

type AlerteSuppressionProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: string;
  message?: string;
  onDelete: () => void;
};

const AlerteSuppression = ({
  isOpen,
  setIsOpen,
  title,
  message,
  onDelete,
}: AlerteSuppressionProps) => {
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

export default AlerteSuppression;
