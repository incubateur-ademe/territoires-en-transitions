import { appLabels } from '@/app/labels/catalog';
import { BaseUpdateFicheModal } from '@/app/plans/fiches/show-fiche/components/base-update-fiche.modal';
import {
    AddPreuveModal,
    TAddPreuveModalHandlers,
} from '@/app/referentiels/preuves/AddPreuveModal';
import type { TOnDuplicatedDocumentsAdded } from '@/app/referentiels/preuves/AddPreuveModal/types';
import { FicheWithRelations } from '@tet/domain/plans';

type ModaleAjoutDocumentProps = {
  handlers: TAddPreuveModalHandlers;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheWithRelations;
  onDuplicatedDocumentsAdded?: TOnDuplicatedDocumentsAdded;
};

const ModaleAjoutDocument = ({
  isOpen,
  handlers,
  setIsOpen,
  fiche,
  onDuplicatedDocumentsAdded,
}: ModaleAjoutDocumentProps) => {
  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={{ isOpen, setIsOpen }}
      title={appLabels.ajouterDocument}
      size="lg"
      render={({ close }) => (
        <div>
          <AddPreuveModal
            docType="annexe"
            onClose={close}
            handlers={handlers}
            onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
          />
        </div>
      )}
    />
  );
};

export default ModaleAjoutDocument;
