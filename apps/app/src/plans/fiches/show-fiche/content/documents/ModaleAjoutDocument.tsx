import { appLabels } from '@/app/labels/catalog';
import { UpdateFicheModalBody } from '@/app/plans/fiches/components/update-fiche-modal-body';
import {
  AddPreuveModal,
  TAddPreuveModalHandlers,
} from '@/app/referentiels/preuves/AddPreuveModal';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal } from '@tet/ui/design-system/ModalNext/index';

type ModaleAjoutDocumentProps = {
  handlers: TAddPreuveModalHandlers;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheWithRelations;
};

const ModaleAjoutDocument = ({
  isOpen,
  handlers,
  setIsOpen,
  fiche,
}: ModaleAjoutDocumentProps) => {
  return (
    <Modal openState={{ isOpen: isOpen, setIsOpen: setIsOpen }} size="lg">
      <Modal.Header>
        <Modal.Title>{appLabels.ajouterDocument}</Modal.Title>
      </Modal.Header>
      <UpdateFicheModalBody fiche={fiche}>
        <AddPreuveModal
          docType="annexe"
          onClose={() => setIsOpen(false)}
          handlers={handlers}
        />
      </UpdateFicheModalBody>
    </Modal>
  );
};

export default ModaleAjoutDocument;
