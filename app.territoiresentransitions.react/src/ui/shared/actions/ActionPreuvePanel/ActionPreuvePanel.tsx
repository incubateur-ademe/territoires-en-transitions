import {ChangeEvent, MouseEvent, useState} from 'react';
import {TextInput} from '@dataesr/react-dsfr';
import {FichierPreuve} from 'generated/dataLayer/preuve_read';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {AddPreuveButton} from 'ui/shared/actions/AddPreuve';
import {ButtonComment, ButtonRemove} from 'ui/shared/SmallIconButton';
import {supabaseClient} from 'core-logic/api/supabase';
import {useActionPreuve} from 'core-logic/hooks/referentiel';
import {TPreuveFichiersHook, usePreuveFichiers} from 'core-logic/hooks/preuve';
import {preuveWriteEndpoint} from 'core-logic/api/endpoints/PreuveWriteEndpoint';

export type TActionPreuvePanelProps = {
  action: ActionDefinitionSummary;
};

export type TActionPreuveFilesProps = {
  action: ActionDefinitionSummary;
  preuveFichiers: TPreuveFichiersHook;
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export const ActionPreuvePanel = (props: TActionPreuvePanelProps) => {
  const {action} = props;
  const preuve = useActionPreuve(action.id);
  const preuveFichiers = usePreuveFichiers(action.id);

  return (
    <>
      <p className="text-sm text-grey425">
        Toutes les preuves ajoutées seront visibles par les membres de la
        communauté Territoires en Transitions.
      </p>
      <AddPreuveButton {...props} />
      <ActionPreuveFiles {...props} preuveFichiers={preuveFichiers} />
      <hr className="mt-4" />
      <h6>Liste des preuves requises pour cette action</h6>
      <div className="content" dangerouslySetInnerHTML={{__html: preuve}} />
    </>
  );
};

/**
 * Affiche les fichiers attachés à l'action
 */
const ActionPreuveFiles = (props: TActionPreuveFilesProps) => {
  const {preuveFichiers} = props;
  const {fichiers} = preuveFichiers;
  if (!fichiers?.length) {
    return null;
  }

  return (
    <div className="mt-2">
      {fichiers.map(file => (
        <PreuveFile key={file.filename} file={file} />
      ))}
    </div>
  );
};

/**
 * Affiche le détail d'un fichier
 */
const PreuveFile = ({file}: {file: FichierPreuve}) => {
  const {filename, bucket_id, commentaire} = file;
  const [isEditingComment, setEditingComment] = useState(false);
  const [updatedComment, setUpdatedComment] = useState(commentaire);

  const removePreuve = () => {
    console.log('TODO');
  };

  // télécharge le fichier avant de l'afficher dans un nouvel onglet
  // l'ouverture directe de l'URL ne fonctionne pas car les headers d'auth. sont absents
  const openFileInNewTab = async () => {
    const {data, error} = await supabaseClient.storage
      .from(bucket_id)
      .download(filename);
    if (error) {
      console.log(error.message);
    }
    if (data) {
      const fileURL = URL.createObjectURL(data);
      window.open(fileURL);
    }
  };

  return (
    <div>
      <p className="flex justify-between group text-sm text-bf500 hover:bg-bf975 px-2 py-1 max-w-2xl mb-0">
        <div onClick={openFileInNewTab}>{filename}</div>
        <div className="invisible group-hover:visible">
          <ButtonComment
            title="Commentaire"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setEditingComment(true);
            }}
          />
          <ButtonRemove
            title="Supprimer"
            className="fr-fi-delete-line"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              removePreuve();
            }}
          />
        </div>
      </p>
      {!isEditingComment && commentaire ? (
        <p
          className="text-sm text-gray-500 pl-2 pb-4"
          onClick={(e: MouseEvent<HTMLParagraphElement>) => {
            e.preventDefault();
            setEditingComment(true);
          }}
        >
          {commentaire}
        </p>
      ) : null}
      {isEditingComment ? (
        <TextInput
          autoFocus
          placeholder="Écrire un commentaire..."
          className="mt-2"
          value={updatedComment}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setUpdatedComment(e.target.value)
          }
          onBlur={() => {
            setEditingComment(false);
            preuveWriteEndpoint.save({
              ...file,
              commentaire: updatedComment,
            });
          }}
        />
      ) : null}
    </div>
  );
};

/**
 * COMMENTER EN ATTENDANT DE POUVOIR LISTER LES LIBELLES DES PREUVES INDIVIDUELLEMENT
 *
 * Affiche le titre d'une preuve et le bouton (i) / dialogue "info" si nécessaire
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
 */
