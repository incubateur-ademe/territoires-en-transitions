import {Alert, Button} from '@tet/ui';

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
    <Alert
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      className="absolute bottom-0 left-0 right-0 w-screen z-modal border-t border-t-info-1"
      title={title}
      description={message}
      footer={
        <div className="flex gap-3">
          <Button variant="outlined" size="xs" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button
            size="xs"
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
          >
            Confirmer
          </Button>
        </div>
      }
    />
  );
};

export default AlerteSuppression;
