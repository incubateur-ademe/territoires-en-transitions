/**
 * Affiche le sélecteur de ressources (fichiers ou liens)
 */
import { Tab, Tabs } from '@tet/ui';
import { FileConstraints } from '../upload/constants';
import { AddFile, AddFileFromLibHandler } from './add-file';
import AddFromBibliotheque from './add-from-bibliotheque';
import { AddLink, AddLinkHandler } from './add-link';
import { DocType, OnDuplicatedDocumentsAdded } from './types';

export type AddDocumentTabsHandlers = {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: AddFileFromLibHandler;
  /** ajoute un lien (l'onglet 'Lien' ne s'affiche pas si non renseigné) */
  addLink?: AddLinkHandler;
};

export type AddDocumentTabsProps = {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  /** Type des documents attendus */
  docType?: DocType;
  /** Formats et taille acceptés (par défaut : ceux de la bibliothèque) */
  fileConstraints?: FileConstraints;
  /** Gestionnaires d'événements */
  handlers: AddDocumentTabsHandlers;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
  onClose: () => void;
};

export const AddDocumentTabs = (props: AddDocumentTabsProps) => {
  const { defaultActiveTab, handlers, onDuplicatedDocumentsAdded } = props;
  const { addFileFromLib, addLink } = handlers;

  return (
    <Tabs defaultActiveTab={defaultActiveTab}>
      {addLink && (
        <Tab label="Lien">
          <AddLink {...props} onAddLink={addLink} />
        </Tab>
      )}
      <Tab label="Fichier">
        <AddFile
          {...props}
          onAddFileFromLib={addFileFromLib}
          onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
        />
      </Tab>
      <Tab label="Bibliothèque">
        <AddFromBibliotheque {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
    </Tabs>
  );
};
