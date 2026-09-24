import { appLabels } from '@/app/labels/catalog';
import { AddDocumentTabs } from '@/app/collectivites/documents/add-document/add-document.tabs';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button, Modal } from '@tet/ui';
import { useState } from 'react';
import type { OnDuplicatedDocumentsAdded } from './add-document/types';
import { useAddPreuveReglementaireToAction } from './use-add-preuve-to-action';

export type AddPreuveReglementaireModalProps = {
  preuveId: string;
  preuveNom: string;
  actionId: string;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
};

export const AddPreuveReglementaireModal = (
  props: AddPreuveReglementaireModalProps
) => {
  const [opened, setOpened] = useState(false);
  const { preuveId, preuveNom, actionId, onDuplicatedDocumentsAdded } = props;
  const handlers = useAddPreuveReglementaireToAction(preuveId);
  const referentielId = getReferentielIdFromActionId(actionId);
  const { hasReferentielPermission } = useCurrentCollectivite();

  if (!hasReferentielPermission('referentiels.mutate', referentielId)) {
    return null;
  }

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      title={appLabels.ajouterDocumentAttendu}
      render={({ close }) => {
        return (
          <AddDocumentTabs
            docType="reglementaire"
            onClose={close}
            handlers={handlers}
            onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
          />
        );
      }}
    >
      <Button
        size="xs"
        icon="file-add-fill"
        title={appLabels.ajouterPreuve}
        aria-label={appLabels.ajouterPreuvePour(preuveNom)}
        onClick={() => setOpened(true)}
        className="w-12 flex items-center justify-center"
      />
    </Modal>
  );
};
