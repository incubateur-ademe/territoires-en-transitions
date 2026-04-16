import { appLabels } from '@/app/labels/catalog';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';

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
    <Modal
      title={appLabels.modifierTypeBudgetQuestion}
      render={() => (
        <Alert
          state="warning"
          title={appLabels.modifierTypeBudgetAlerte({ nextMode })}
        />
      )}
      openState={{ isOpen, setIsOpen }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => {
              onCancel();
              close();
            },
          }}
          btnOKProps={{
            onClick: async () => {
              await onValidate();
              close();
            },
          }}
        />
      )}
    />
  );
};
