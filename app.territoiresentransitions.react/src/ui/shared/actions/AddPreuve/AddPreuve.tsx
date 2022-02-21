/**
 * Affiche le sélecteur de preuves
 */
import {Tabs, Tab} from '@dataesr/react-dsfr';
import {AddPreuveFichier} from './AddPreuveFichier';

export type TAddPreuveProps = {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
};

export const AddPreuve = (props: TAddPreuveProps) => {
  const {defaultActiveTab} = props;

  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      <Tab label="&nbsp;Lien" icon="fr-fi-links-fill">
        <p>Lien</p>
      </Tab>
      <Tab label="&nbsp;Fichier" icon="fr-fi-upload-2-fill">
        <AddPreuveFichier />
      </Tab>
      <Tab label="&nbsp;Bibliothèque" icon="fr-fi-archive-line">
        <p>Bibliothèque</p>
      </Tab>
    </Tabs>
  );
};
