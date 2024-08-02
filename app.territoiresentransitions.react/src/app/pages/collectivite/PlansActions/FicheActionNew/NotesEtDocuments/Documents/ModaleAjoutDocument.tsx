import {Modal, ModalFooterOKCancel} from '@tet/ui';

type ModaleAjoutDocumentProps = {
  ficheId: number;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

const ModaleAjoutDocument = ({
  ficheId,
  isOpen,
  setIsOpen,
}: ModaleAjoutDocumentProps) => {
  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Ajouter un document"
      size="lg"
      render={({descriptionId}) => <div id={descriptionId}>{/* to do */}</div>}
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{onClick: close}}
          btnOKProps={{onClick: close}}
        />
      )}
    />
  );
};

export default ModaleAjoutDocument;
