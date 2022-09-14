import {useCollectiviteId} from 'core-logic/hooks/params';
import {TAddFileFromLib} from 'ui/shared/preuves/AddPreuveModal/AddFile';
import {useAddPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/useAddPreuves';

type TAddDocs = (demande_id: number) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers au parcours de labellisation en cours */
export const useAddPreuveToDemande: TAddDocs = (demande_id: number) => {
  const collectivite_id = useCollectiviteId();
  const {mutate: addPreuve} = useAddPreuveLabellisation();

  // associe un fichier de la bibliothèque à la demande
  const addFileFromLib: TAddFileFromLib = fichier_id => {
    if (collectivite_id) {
      addPreuve({
        demande_id,
        collectivite_id,
        commentaire: '',
        fichier_id,
      });
    }
  };
  return {
    addFileFromLib,
  };
};
