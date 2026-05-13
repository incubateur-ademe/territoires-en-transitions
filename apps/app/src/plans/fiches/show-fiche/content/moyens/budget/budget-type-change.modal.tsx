import { appLabels } from '@/app/labels/catalog';
import { Alert } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';

type BudgetView = 'year' | 'summary';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView: BudgetView;
  onValidate: () => Promise<void>;
  onCancel: () => void;
};

export const BudgetTypeChangeModal = ({
  isOpen,
  setIsOpen,
  currentView,
  onValidate,
  onCancel,
}: Props) => {
  const targetView = currentView === 'year' ? 'summary' : 'year';
  const nextMode = targetView === 'summary' ? 'global' : 'détaillé par année';

  return (
    <Modal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }}>
      <Modal.Header>
        <Modal.Title>{appLabels.modifierTypeBudgetQuestion}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert
          state="warning"
          title={appLabels.modifierTypeBudgetAlerte({ nextMode })}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel onClick={onCancel}>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={async () => {
            await onValidate();
            setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
