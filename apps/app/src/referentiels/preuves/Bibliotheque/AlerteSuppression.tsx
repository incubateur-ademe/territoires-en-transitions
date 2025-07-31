import { Modal, ModalFooterOKCancel } from '@/ui';

type AlerteSuppressionProps = {
  className?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: string;
  message?: string;
  onDelete: () => void;
};

const AlerteSuppression = ({
  className,
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
        description={message}
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
