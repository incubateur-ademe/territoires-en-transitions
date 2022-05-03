/**
 * Affiche le sélecteur de preuves
 */
import {useAddDocs} from './useAddDocs';
import {ResourceManager} from 'ui/shared/ResourceManager';

export type TAddDocsProps = {
  /** Identifiant du parcours de labellisation */
  parcours_id: string;
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  onClose: () => void;
};

export const AddDocs = (props: TAddDocsProps) => {
  const {parcours_id, defaultActiveTab, onClose} = props;
  const handlers = useAddDocs(parcours_id);

  return (
    <ResourceManager
      defaultActiveTab={defaultActiveTab}
      onClose={onClose}
      handlers={handlers}
    />
  );
};
