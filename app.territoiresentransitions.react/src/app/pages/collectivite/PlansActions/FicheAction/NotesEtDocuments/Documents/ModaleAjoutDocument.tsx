import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import {
  AddPreuveModal,
  TAddPreuveModalHandlers,
} from '@/app/referentiels/preuves/AddPreuveModal';
import { FicheWithRelations } from '@/domain/plans/fiches';

type ModaleAjoutDocumentProps = {
  handlers: TAddPreuveModalHandlers;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Pick<
    FicheWithRelations,
    'collectiviteId' | 'collectiviteNom' | 'sharedWithCollectivites'
  >;
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
