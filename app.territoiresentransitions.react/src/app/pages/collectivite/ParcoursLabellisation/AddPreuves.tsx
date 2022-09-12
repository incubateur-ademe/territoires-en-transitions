/**
 * Affiche le sélecteur de preuves
 */
import {useAddPreuves} from './useAddPreuves';
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
  const handlers = useAddPreuves(demande_id);

  return (
    <AddPreuveModal
      defaultActiveTab={defaultActiveTab}
      onClose={onClose}
      handlers={handlers}
    />
  );
};
