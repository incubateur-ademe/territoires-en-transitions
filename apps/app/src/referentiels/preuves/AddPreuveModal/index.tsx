/**
 * Affiche le sélecteur de ressources (fichiers ou liens)
 */
import { Tab, Tabs } from '@tet/ui';
import { FileConstraints } from '../upload/constants';
import { AddFile, AddFileFromLibHandler } from './AddFile';
import AddFromLib from './AddFromLib';
import { AddLink, AddLinkHandler } from './AddLink';
import { DocType, OnDuplicatedDocumentsAdded } from './types';

export type AddPreuveModalHandlers = {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: AddFileFromLibHandler;
  /** ajoute un lien (l'onglet 'Lien' ne s'affiche pas si non renseigné) */
  addLink?: AddLinkHandler;
};

export type AddPreuveModalProps = {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  /** Type des documents attendus */
  docType?: DocType;
  /** Formats et taille acceptés (par défaut : ceux de la bibliothèque) */
  fileConstraints?: FileConstraints;
  /** Gestionnaires d'événements */
  handlers: AddPreuveModalHandlers;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
  onClose: () => void;
};

export const AddPreuveModal = (props: AddPreuveModalProps) => {
  const { defaultActiveTab, handlers, onDuplicatedDocumentsAdded } = props;
  const { addFileFromLib, addLink } = handlers;

  return (
    <Tabs data-test="AddPreuveModal" defaultActiveTab={defaultActiveTab}>
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
        <AddFromLib {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
    </Tabs>
  );
};
