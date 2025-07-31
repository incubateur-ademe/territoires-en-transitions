/**
 * Affiche le sélecteur de ressources (fichiers ou liens)
 */
import { Tab, Tabs } from '@/ui';
import { AddFile, TAddFileFromLib } from './AddFile';
import AddFromLib from './AddFromLib';
import { AddLink, TAddLink } from './AddLink';
import { DocType } from './types';

export type TAddPreuveModalHandlers = {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
  /** ajoute un lien (l'onglet 'Lien' ne s'affiche pas si non renseigné) */
  addLink?: TAddLink;
};

export type TAddPreuveModalProps = {
  /** Index de l'onglet actif */
  defaultActiveTab?: number;
  /** Type des documents attendus */
  docType?: DocType;
  /** Gestionnaires d'événements */
  handlers: TAddPreuveModalHandlers;
  onClose: () => void;
};

export const AddPreuveModal = (props: TAddPreuveModalProps) => {
  const { defaultActiveTab, handlers } = props;
  const { addFileFromLib, addLink } = handlers;

  return (
    <Tabs data-test="AddPreuveModal" defaultActiveTab={defaultActiveTab}>
      {addLink && (
        <Tab label="Lien">
          <AddLink {...props} onAddLink={addLink} />
        </Tab>
      )}
      <Tab label="Fichier">
        <AddFile {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
      <Tab label="Bibliothèque">
        <AddFromLib {...props} onAddFileFromLib={addFileFromLib} />
      </Tab>
    </Tabs>
  );
};
