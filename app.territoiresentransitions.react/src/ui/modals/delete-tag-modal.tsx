import { Alert, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';

type DeleteTagModalProps = {
  openState: OpenState;
  tagName: string;
  title?: string;
  message?: string;
  onDelete: () => void;
};

const DeleteTagModal = ({
  openState,
  tagName,
  title,
  message,
  onDelete,
}: DeleteTagModalProps) => {
  return (
    <Modal
      openState={openState}
      title={title ?? 'Supprimer une option'}
      subTitle={tagName}
      render={() => (
        <Alert
          title="Souhaitez-vous vraiment supprimer cette option de votre collectivité ?"
          description={message ?? undefined}
          rounded
        />
      )}
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
  );
};

export default DeleteTagModal;
