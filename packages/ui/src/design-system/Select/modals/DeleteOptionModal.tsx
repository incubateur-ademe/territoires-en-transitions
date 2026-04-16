import { uiLabels } from '@tet/ui/labels/catalog';
import { OpenState } from '../../../utils/types';
import { Alert } from '../../Alert';
import { Modal, ModalFooterOKCancel } from '../../Modal';

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
      title={title ?? uiLabels.supprimerUneOption}
      subTitle={tagName}
      render={() => (
        <Alert
          title={uiLabels.confirmerSuppressionOption}
          description={message ?? undefined}
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
