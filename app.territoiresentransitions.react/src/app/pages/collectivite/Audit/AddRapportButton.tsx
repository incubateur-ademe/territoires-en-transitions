import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';
import {useAddPreuveToAudit} from './useAddPreuveToAudit';

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
  if (!currentCollectivite || currentCollectivite.readonly) {
    return null;
  }

  return (
    <Modal
      size="lg"
      externalOpen={opened}
      setExternalOpen={setOpened}
      render={() => {
        return (
          <>
            <h4>Ajouter le rapport d'audit</h4>
            <AddPreuveModal
              onClose={() => setOpened(false)}
              handlers={handlers}
            />
          </>
        );
      }}
    >
      <button
        data-test="AddRapportButton"
        className="fr-btn fr-btn--sm fr-btn--secondary fr-mb-2w"
        onClick={() => setOpened(true)}
      >
        Ajouter le rapport d'audit
      </button>
    </Modal>
  );
};
