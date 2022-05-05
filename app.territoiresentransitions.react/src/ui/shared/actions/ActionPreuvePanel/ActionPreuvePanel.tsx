import {ChangeEvent, KeyboardEvent, MouseEvent, useState} from 'react';
import {TextInput} from '@dataesr/react-dsfr';
import {PreuveRead} from 'generated/dataLayer/preuve_read';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {AddPreuveButton} from 'ui/shared/actions/AddPreuve';
import {ButtonComment, ButtonRemove} from 'ui/shared/SmallIconButton';
import {supabaseClient} from 'core-logic/api/supabase';
import {useActionPreuve} from 'core-logic/hooks/referentiel';
import {usePreuves} from 'core-logic/hooks/preuve';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {PreuveFichierRead} from 'generated/dataLayer/preuve_fichier_read';
import {preuveLienWriteEndpoint} from 'core-logic/api/endpoints/PreuveLienWriteEndpoint';
import {PreuveLienRead} from 'generated/dataLayer/preuve_lien_read';

export type TActionPreuvePanelProps = {
  action: ActionDefinitionSummary;
};

export type TActionPreuvesProps = {
  action: ActionDefinitionSummary;
  preuves: PreuveRead[];
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export default (props: TActionPreuvePanelProps) => {
  const {action} = props;
  const preuveContent = useActionPreuve(action.id);
  const preuves = usePreuves(action.id);

  return (
    <>
      <p className="text-sm text-grey425">
        Toutes les preuves ajoutées seront visibles par les membres de la
        communauté Territoires en Transitions.
      </p>
      <AddPreuveButton {...props} />
      <ActionPreuves {...props} preuves={preuves} />
      <hr className="mt-4" />
      <h6>Liste des preuves requises pour cette action</h6>
      <div
        className="content"
        dangerouslySetInnerHTML={{__html: preuveContent}}
      />
    </>
  );
};

/**
 * Affiche les fichiers attachés à l'action
 */
const ActionPreuves = ({preuves}: {preuves: PreuveRead[]}) => {
  if (!preuves.length) {
    return null;
  }

  return (
    <div className="mt-2" data-test="ActionPreuves">
      {preuves.map(preuve => (
        <PreuveFichierDetail
          key={preuve.id || preuve.filename}
          preuve={preuve}
        />
      ))}
    </div>
  );
};

/**
 * Affiche le détail d'un fichier
 */
const PreuveFichierDetail = ({preuve}: {preuve: PreuveRead}) => {
  const {type: _type, action_id, collectivite_id, commentaire} = preuve;
  const {bucket_id, filename} = preuve as PreuveFichierRead;
  const {id: preuveId, url, titre} = preuve as PreuveLienRead;

  const [isEditingComment, setEditingComment] = useState(false);
  const [updatedComment, setUpdatedComment] = useState(commentaire);

  const removePreuve = () => {
    if (confirm('Voulez-vous vraiment supprimer cette preuve ?')) {
      if (_type === 'fichier') {
        preuveFichierWriteEndpoint.delete({
          action_id,
          collectivite_id,
          filename,
        });
      } else {
        preuveLienWriteEndpoint.delete(preuveId);
      }
    }
  };

  const updatePreuve = () => {
    setEditingComment(false);
    if (_type === 'fichier') {
      preuveFichierWriteEndpoint.save({
        collectivite_id,
        action_id,
        filename,
        commentaire: updatedComment,
      });
    } else {
      preuveLienWriteEndpoint.save({
        id: preuveId,
        collectivite_id,
        action_id,
        titre,
        url,
        commentaire: updatedComment,
      });
    }
  };

  const openInNewTab = async () => {
    if (_type === 'fichier') {
      // télécharge le fichier car l'ouverture directe de l'URL ne fonctionne
      // pas, les headers d'authenfication étant absents
      const {data} = await supabaseClient.storage
        .from(bucket_id)
        .download(filename);

      // si le téléchargement a réussi
      if (data) {
        // crée un blob
        const blobURL = URL.createObjectURL(data);

        // crée un lien invisible
        const a = document.createElement('a');
        document.body.appendChild(a);

        // affecte au lien le blob et le nom du fichier téléchargé
        a.href = blobURL;
        a.download = filename;

        // déclenche le téléchargement puis supprime le lien
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(blobURL);
          document.body.removeChild(a);
        }, 0);
      }
    } else {
      window.open(url);
    }
  };

  return (
    <div>
      <div className="flex justify-between group text-sm text-bf500 hover:bg-bf975 px-2 py-1 max-w-2xl mb-0">
        <div onClick={openInNewTab}>{filename || titre}</div>
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
      </div>
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
          onBlur={updatePreuve}
          onKeyUp={(e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              updatePreuve();
            }
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
