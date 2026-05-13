import { appLabels } from '@/app/labels/catalog';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';

type AlerteSuppressionProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
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
    <AlertModal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }}>
      <AlertModal.Header>
        <AlertModal.Title>{title}</AlertModal.Title>
      </AlertModal.Header>
      {message && (
        <AlertModal.Body>
          <AlertModal.Description>{message}</AlertModal.Description>
        </AlertModal.Body>
      )}
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action onClick={onDelete}>
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};

export default AlerteSuppression;
