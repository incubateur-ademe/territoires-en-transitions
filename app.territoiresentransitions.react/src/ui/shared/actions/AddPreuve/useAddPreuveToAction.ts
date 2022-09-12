import {useCollectiviteId} from 'core-logic/hooks/params';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {preuveLienWriteEndpoint} from 'core-logic/api/endpoints/PreuveLienWriteEndpoint';
import {TAddFileFromLib} from 'ui/shared/preuves/AddPreuveModal/AddFile';
import {TAddLink} from 'ui/shared/preuves/AddPreuveModal/AddLink';

type TResourceDialog = (action_id: string) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
  /** ajoute un lien */
  addLink: TAddLink;
};

/** Renvoie les gestionnaires d'événement du dialogue d'ajout de liens et
 * fichiers à une action */
export const useAddPreuveToAction: TResourceDialog = (action_id: string) => {
  const collectivite_id = useCollectiviteId();

  // associe un fichier sélectionné depuis la bibliothèque à une action
  const addFileFromLib: TAddFileFromLib = filename =>
    collectivite_id
      ? preuveFichierWriteEndpoint.save({
          action_id,
          collectivite_id,
          commentaire: '',
          filename,
        })
      : Promise.resolve(false);

  // associe un lien+titre à une action
  const addLink: TAddLink = (titre, url) =>
    collectivite_id
      ? preuveLienWriteEndpoint
          .save({
            action_id,
            collectivite_id,
            titre,
            url,
            commentaire: '',
          })
          .then(preuveLien => Boolean(preuveLien))
      : Promise.resolve(false);

  return {
    addFileFromLib,
    addLink,
  };
};
