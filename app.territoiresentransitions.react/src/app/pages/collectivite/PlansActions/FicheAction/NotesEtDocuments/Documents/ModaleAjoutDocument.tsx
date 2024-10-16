import {Modal} from '@tet/ui';
import {
  AddPreuveModal,
  TAddPreuveModalHandlers,
} from 'ui/shared/preuves/AddPreuveModal';

type ModaleAjoutDocumentProps = {
  handlers: TAddPreuveModalHandlers;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

const ModaleAjoutDocument = ({
  isOpen,
  handlers,
  setIsOpen,
}: ModaleAjoutDocumentProps) => {
  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Ajouter un document"
      size="lg"
      render={({ descriptionId, close }) => (
        <div id={descriptionId}>
          <AddPreuveModal
            docType="annexe"
            onClose={close}
            handlers={handlers}
          />
        </div>
      )}
    />
  );
};

export default ModaleAjoutDocument;
