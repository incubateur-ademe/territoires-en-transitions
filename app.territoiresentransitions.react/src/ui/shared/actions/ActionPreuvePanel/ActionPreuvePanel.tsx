import Dialog from '@material-ui/core/Dialog';
import {Highlight} from '@dataesr/react-dsfr';
import {useState} from 'react';
import {AddPreuveButton} from '../AddPreuve';

type TActionPreuve = {
  /** Titre */
  title: string;
  /** Information complémentaire */
  info?: string;
  /** Fichiers attachés à l'action */
  files?: Array<TActionPreuveFile>;
};

type TActionPreuveFile = {
  /** Nom du fichier */
  pathName: string;
  /** Commentaire associé */
  comment?: string;
};

export type TActionPreuvePanelProps = {
  preuve: TActionPreuve;
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export const ActionPreuvePanel = (props: TActionPreuvePanelProps) => {
  const {preuve} = props;

  return (
    <>
      <p className="text-sm text-grey425">
        Toutes les preuves ajoutées seront visibles par les membres de la
        communauté Territoires en Transitions.
      </p>
      <AddPreuveButton />
    </>
  );
};

/**
 * Affiche le titre d'une preuve et le bouton (i) / dialogue "info" si nécessaire
 */
const ActionPreuveTitle = ({preuve}: {preuve: TActionPreuve}) => {
  const [opened, setOpened] = useState(false);
  const {title, info} = preuve;

  return (
    <>
      <p className="pb-4">
        {title}
        {info ? (
          <i
            className="fr-fi-information-fill text-bf500"
            onClick={() => {
              if (info) {
                setOpened(true);
              }
            }}
          />
        ) : null}
      </p>
      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        maxWidth="md"
        fullWidth={true}
      >
        <div className="p-7 flex flex-col">
          <h4 className="pb-4">Pièces complémentaires</h4>
          <p>{info} </p>
        </div>
      </Dialog>
    </>
  );
};

/**
 * Affiche les fichiers attachés à l'action
 */
const ActionPreuveFiles = ({preuve}: {preuve: TActionPreuve}) => {
  const {files} = preuve;

  if (!files?.length) {
    return null;
  }

  return (
    <>
      {files.map(file => (
        <PreuveFile key={file.pathName} file={file} />
      ))}
    </>
  );
};

/**
 * Affiche le détail d'un fichier
 */
const PreuveFile = ({file}: {file: TActionPreuveFile}) => {
  const {pathName, comment} = file;

  return (
    <div>
      <p className="flex justify-between group text-sm text-bf500 hover:bg-bf975 px-2 py-1 max-w-2xl">
        {pathName}
        <div className="invisible group-hover:visible">
          <i className="fr-fi-chat-quote-line hover:fr-fi-chat-quote-fill mr-2"></i>
          <i className="fr-fi-delete-line hover:fr-fi-delete-line"></i>
        </div>
      </p>
      {comment ? (
        <p className="text-sm text-gray-500 pl-2 pb-4">{comment}</p>
      ) : null}
    </div>
  );
};
