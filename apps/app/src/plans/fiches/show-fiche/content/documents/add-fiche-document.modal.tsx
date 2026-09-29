import { appLabels } from '@/app/labels/catalog';
import { BaseUpdateFicheModal } from '@/app/plans/fiches/show-fiche/components/base-update-fiche.modal';
import {
  AddDocumentTabs,
  AddDocumentTabsHandlers,
} from '@/app/collectivites/documents/add-document/add-document.tabs';
import type { OnDuplicatedDocumentsAdded } from '@/app/collectivites/documents/add-document/types';
import { FicheWithRelations } from '@tet/domain/plans';

type AddFicheDocumentModalProps = {
  handlers: AddDocumentTabsHandlers;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: FicheWithRelations;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
};

export const AddFicheDocumentModal = ({
  isOpen,
  handlers,
  setIsOpen,
  fiche,
  onDuplicatedDocumentsAdded,
}: AddFicheDocumentModalProps) => {
  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={{ isOpen, setIsOpen }}
      title={appLabels.ajouterDocument}
      size="lg"
      render={({ close }) => (
        <div>
          <AddDocumentTabs
            preuveType="annexe"
            onClose={close}
            handlers={handlers}
            onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
          />
        </div>
      )}
    />
  );
};
