/**
 * Affiche le sélecteur de ressources (fichiers ou liens)
 */
import {Tabs, Tab} from '@dataesr/react-dsfr';
import {AddLink, TAddLink} from './AddLink';
import {AddFile, TAddFileFromLib} from './AddFile';
import {AddFromLib} from './AddFromLib';

export type TResourceManagerHandlers = {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
  /** ajoute un lien (l'onglet 'Lien' ne s'affiche pas si non renseigné) */
  addLink?: TAddLink;
};

export type TResourceManagerProps = {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  /** Gestionnaires d'événements */
  handlers: TResourceManagerHandlers;
  onClose: () => void;
};

export const ResourceManager = (props: TResourceManagerProps) => {
  const {defaultActiveTab, handlers} = props;
  const {addFileFromLib, addLink} = handlers;

  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      {addLink ? (
        <Tab label="&nbsp;Lien" icon="fr-fi-links-fill">
          <AddLink {...props} onAddLink={addLink} />
        </Tab>
      ) : null}
      <Tab label="&nbsp;Fichier" icon="fr-fi-upload-2-fill">
        <AddFile {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
      <Tab label="&nbsp;Bibliothèque" icon="fr-fi-archive-line">
        <AddFromLib {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
    </Tabs>
  );
};
