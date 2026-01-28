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
      title="Modifier le type de budget ?"
      render={() => (
        <Alert
          state="warning"
          title={`Attention : en passant au mode ${nextMode}, les données budgétaires actuelles seront supprimées.`}
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
