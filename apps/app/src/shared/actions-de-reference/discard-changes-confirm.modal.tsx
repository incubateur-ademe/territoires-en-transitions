import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import type { DiscardChangesConfirmModalComponent } from './actions-de-reference.contract';

const DiscardChangesConfirmModal: DiscardChangesConfirmModalComponent = ({
  isOpen,
  onDiscard,
  onKeepEditing,
}) => (
  <Modal
    size="xs"
    title={appLabels.actionDeReferenceModificationsNonEnregistreesTitre}
    openState={{
      isOpen,
      setIsOpen: (isOpenRequested) => {
        if (isOpenRequested) {
          return;
        }
        onKeepEditing();
      },
    }}
    render={() => (
      <p className="mb-0 text-sm text-grey-8">
        {appLabels.actionDeReferenceModificationsNonEnregistreesDescription}
      </p>
    )}
    renderFooter={() => (
      <ModalFooterOKCancel
        btnCancelProps={{
          children: appLabels.actionDeReferencePoursuivreModification,
          onClick: onKeepEditing,
        }}
        btnOKProps={{
          children: appLabels.actionDeReferenceAbandonnerModifications,
          onClick: onDiscard,
        }}
      />
    )}
  />
);

export { DiscardChangesConfirmModal };
