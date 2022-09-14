/**
 * Affiche le sélecteur de preuves
 */
import {useAddPreuveToDemande} from './useAddPreuveToDemande';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';

export type TAddDocsProps = {
  /** Identifiant de la demande de labellisation */
  demande_id: number;
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  onClose: () => void;
};

export const AddDocs = (props: TAddDocsProps) => {
  const {demande_id, defaultActiveTab, onClose} = props;
  const handlers = useAddPreuveToDemande(demande_id);

  return (
    <AddPreuveModal
      defaultActiveTab={defaultActiveTab}
      onClose={onClose}
      handlers={handlers}
    />
  );
};
