import {useState} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {labellisationFichierWriteEndpoint} from 'core-logic/api/endpoints/LabellisationFichierWriteEndpoint';
import {LabellisationPreuveFichierRead} from 'generated/dataLayer/labellisation_preuve_fichier_read';
import {TEditHandlers} from 'ui/shared/ResourceManager/types';

type TEditPreuve = (
  preuve: LabellisationPreuveFichierRead,
  demande_id: number
) => TEditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuves: TEditPreuve = (preuve, demande_id) => {
  const {filename, commentaire} = preuve;
  const collectivite_id = useCollectiviteId();
  const [isEditingComment, setEditingComment] = useState(false);
  const [updatedComment, setUpdatedComment] = useState(commentaire);

  const remove = () => {
    if (collectivite_id) {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('Voulez-vous vraiment supprimer cette preuve ?')) {
        labellisationFichierWriteEndpoint.delete({
          collectivite_id,
          demande_id,
          filename,
        });
      }
    }
  };

  const update = () => {
    setEditingComment(false);
    if (collectivite_id) {
      labellisationFichierWriteEndpoint.save({
        collectivite_id,
        demande_id,
        filename,
        commentaire: updatedComment,
      });
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
