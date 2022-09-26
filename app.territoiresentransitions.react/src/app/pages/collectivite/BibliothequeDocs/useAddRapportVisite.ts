import {useCollectiviteId} from 'core-logic/hooks/params';
import {TAddFileFromLib} from 'ui/shared/preuves/AddPreuveModal/AddFile';
import {TAddLink} from 'ui/shared/preuves/AddPreuveModal/AddLink';
import {useAddPreuveRapport} from 'ui/shared/preuves/Bibliotheque/useAddPreuves';

type TAddDocs = (date: string) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
  /** ou un lien */
  addLink: TAddLink;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers au parcours de labellisation en cours */
export const useAddRapportVisite: TAddDocs = date => {
  const collectivite_id = useCollectiviteId();
  const {mutate: addPreuve} = useAddPreuveRapport();

  // associe un fichier de la bibliothèque à la demande
  const addFileFromLib: TAddFileFromLib = fichier_id => {
    if (collectivite_id) {
      addPreuve({
        collectivite_id,
        commentaire: '',
        fichier_id,
        date: new Date(date).toISOString(),
      });
    }
  };

  const addLink: TAddLink = (titre, url) => {
    if (collectivite_id) {
      addPreuve({
        collectivite_id,
        commentaire: '',
        titre,
        url,
        date,
      });
    }
  };

  return {
    addFileFromLib,
    addLink,
  };
};
