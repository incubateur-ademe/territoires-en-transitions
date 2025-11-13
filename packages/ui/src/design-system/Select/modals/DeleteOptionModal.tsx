import { OpenState } from '../../../utils/types';
import { Alert } from '../../Alert';
import { Modal } from '../../Modal';
import { ModalFooterOKCancel } from '../../Modal/ModalFooterOKCancel';

type DeleteOptionModalProps = {
  openState: OpenState;
  tagName: string;
  title?: string;
  message?: string;
  onDelete: () => void;
};

export const DeleteOptionModal = ({
  openState,
  tagName,
  title,
  message,
  onDelete,
}: DeleteOptionModalProps) => {
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
