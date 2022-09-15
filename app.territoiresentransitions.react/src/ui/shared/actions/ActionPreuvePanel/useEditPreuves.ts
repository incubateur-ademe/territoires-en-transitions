import {useState} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {PreuveFichierRead} from 'generated/dataLayer/preuve_fichier_read';
import {preuveLienWriteEndpoint} from 'core-logic/api/endpoints/PreuveLienWriteEndpoint';
import {PreuveLienRead} from 'generated/dataLayer/preuve_lien_read';
import {TEditHandlers} from 'ui/shared/ResourceManager/types';

type TEditPreuve = (
  preuve: PreuveFichierRead | PreuveLienRead
) => TEditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuves: TEditPreuve = preuve => {
  const {id, type, action_id, commentaire} = preuve;
  const {filename} = preuve as PreuveFichierRead;
  const {titre, url} = preuve as PreuveLienRead;
  const collectivite_id = useCollectiviteId();
  const [isEditingComment, setEditingComment] = useState(false);
  const [updatedComment, setUpdatedComment] = useState(commentaire);

  const remove = () => {
    if (collectivite_id) {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('Voulez-vous vraiment supprimer cette preuve ?')) {
        if (type === 'fichier') {
          preuveFichierWriteEndpoint.delete({
            action_id,
            collectivite_id,
            filename,
          });
        } else if (id) {
          preuveLienWriteEndpoint.delete(id);
        }
      }
    }
  };

  const update = () => {
    setEditingComment(false);
    if (collectivite_id) {
      if (type === 'fichier') {
        preuveFichierWriteEndpoint.save({
          collectivite_id,
          action_id,
          filename,
          commentaire: updatedComment,
        });
      } else if (id) {
        preuveLienWriteEndpoint.save({
          id,
          collectivite_id,
          action_id,
          titre,
          url,
          commentaire: updatedComment,
        });
      }
    }
  };

  return {
    remove,
    update,
    isEditingComment,
    setEditingComment,
    updatedComment,
    setUpdatedComment,
  };
};
