import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import {
  AddPreuveModal,
  TAddPreuveModalHandlers,
} from '@/app/referentiels/preuves/AddPreuveModal';

type ModaleAjoutDocumentProps = {
  handlers: TAddPreuveModalHandlers;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheShareProperties;
};

const ModaleAjoutDocument = ({
  isOpen,
  handlers,
  setIsOpen,
  fiche,
}: ModaleAjoutDocumentProps) => {
  return (
    <BaseUpdateFicheModal
      fiche={fiche}
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
