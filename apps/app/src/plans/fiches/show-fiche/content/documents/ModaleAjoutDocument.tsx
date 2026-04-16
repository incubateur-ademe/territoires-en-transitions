import { BaseUpdateFicheModal } from '@/app/plans/fiches/show-fiche/components/base-update-fiche.modal';
import { appLabels } from '@/app/labels/catalog';
import {
  AddPreuveModal,
  TAddPreuveModalHandlers,
} from '@/app/referentiels/preuves/AddPreuveModal';
import { FicheWithRelations } from '@tet/domain/plans';

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
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={{ isOpen, setIsOpen }}
      title={appLabels.ajouterDocument}
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
