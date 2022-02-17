/**
 * Affiche le sélecteur de preuves
 */
import {Tabs, Tab} from '@dataesr/react-dsfr';
import {AddPreuveFichier} from './AddPreuveFichier';

export type TAddPreuveProps = {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  /** Fonction appelée pour téléverser les fichiers sélectionnés */
  uploadFiles: (
    files: Array<File>
  ) => Promise<{data: {Key: string} | null; error: Error | null}>;
};

export const AddPreuve = (props: TAddPreuveProps) => {
  const {defaultActiveTab, uploadFiles} = props;

  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      <Tab label="&nbsp;Lien" icon="fr-fi-links-fill">
        <p>Lien</p>
      </Tab>
      <Tab label="&nbsp;Fichier" icon="fr-fi-upload-2-fill">
        <AddPreuveFichier uploadFiles={uploadFiles} />
      </Tab>
      <Tab label="&nbsp;Bibliothèque" icon="fr-fi-archive-line">
        <p>Bibliothèque</p>
      </Tab>
    </Tabs>
  );
};
