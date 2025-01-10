import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Modal } from '@/ui';
import { useState } from 'react';
import { useAddPreuveToAudit } from './useAddPreuveToAudit';

export type TAddDocsButtonProps = {
  audit_id: number;
};

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * le rapport d'audit.
 */
export const AddRapportButton = (props: TAddDocsButtonProps) => {
  const [opened, setOpened] = useState(false);
  const handlers = useAddPreuveToAudit(props.audit_id);
  const currentCollectivite = useCurrentCollectivite();
  if (!currentCollectivite || currentCollectivite.isReadOnly) {
    return null;
  }

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      title="Ajouter le rapport d'audit"
      render={({ close }) => {
        return <AddPreuveModal onClose={close} handlers={handlers} />;
      }}
    >
      <button
        data-test="AddRapportButton"
        className="fr-btn fr-btn--sm fr-btn--secondary fr-mb-2w"
        onClick={() => setOpened(true)}
      >
        {"Ajouter le rapport d'audit"}
      </button>
    </Modal>
  );
};
