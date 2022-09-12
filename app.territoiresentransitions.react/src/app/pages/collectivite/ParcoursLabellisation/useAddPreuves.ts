import {useCollectiviteId} from 'core-logic/hooks/params';
import {labellisationFichierWriteEndpoint} from 'core-logic/api/endpoints/LabellisationFichierWriteEndpoint';
import {TAddFileFromLib} from 'ui/shared/preuves/AddPreuveModal/AddFile';

type TAddDocs = (demande_id: number) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers au parcours de labellisation en cours */
export const useAddPreuves: TAddDocs = (demande_id: number) => {
  const collectivite_id = useCollectiviteId();

  // associe un fichier sélectionné depuis la bibliothèque
  const addFileFromLib: TAddFileFromLib = filename =>
    collectivite_id
      ? labellisationFichierWriteEndpoint.save({
          demande_id,
          collectivite_id,
          commentaire: '',
          filename,
        })
      : Promise.resolve(false);

  return {
    addFileFromLib,
  };
};
