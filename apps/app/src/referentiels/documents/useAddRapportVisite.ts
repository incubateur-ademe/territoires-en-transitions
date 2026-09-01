import { AddFileFromLibHandler } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { AddLinkHandler } from '@/app/referentiels/preuves/AddPreuveModal/AddLink';
import { useAddPreuveRapport } from '@/app/referentiels/preuves/useAddPreuves';
import { useCollectiviteId } from '@tet/api/collectivites';

type TAddDocs = (date: string) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: AddFileFromLibHandler;
  /** ou un lien */
  addLink: AddLinkHandler;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers au parcours de labellisation en cours */
export const useAddRapportVisite: TAddDocs = (date) => {
  const collectivite_id = useCollectiviteId();
  const { mutate: addPreuve } = useAddPreuveRapport();

  // associe un fichier de la bibliothèque à la demande
  const addFileFromLib: AddFileFromLibHandler = (fichier_id) => {
    if (collectivite_id) {
      addPreuve({
        collectivite_id,
        commentaire: '',
        fichier_id,
        date: new Date(date).toISOString(),
      });
    }
  };

  const addLink: AddLinkHandler = (titre, url) => {
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
