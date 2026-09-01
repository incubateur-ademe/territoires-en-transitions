import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button, Modal } from '@tet/ui';
import { useState } from 'react';
import type { TOnDuplicatedDocumentsAdded } from './AddPreuveModal/types';
import { useAddPreuveReglementaireToAction } from './useAddPreuveToAction';

export type TAddPreuveButtonProps = {
  preuve_id: string;
  actionId: string;
  onDuplicatedDocumentsAdded?: TOnDuplicatedDocumentsAdded;
};

export const AddPreuveReglementaire = (props: TAddPreuveButtonProps) => {
  const [opened, setOpened] = useState(false);
  const { preuve_id, actionId, onDuplicatedDocumentsAdded } = props;
  const handlers = useAddPreuveReglementaireToAction(preuve_id);
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
          <AddPreuveModal
            docType="reglementaire"
            onClose={close}
            handlers={handlers}
            onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
          />
        );
      }}
    >
      <Button
        dataTest={`AddPreuveReglementaire-${preuve_id}`}
        size="xs"
        icon="file-add-fill"
        title={appLabels.ajouterPreuve}
        onClick={() => setOpened(true)}
        className="w-12 flex items-center justify-center"
      />
    </Modal>
  );
};
