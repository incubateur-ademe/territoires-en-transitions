import { TAddFileFromLib } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { TAddLink } from '@/app/referentiels/preuves/AddPreuveModal/AddLink';
import { useAddPreuveAnnexe } from '@/app/referentiels/preuves/useAddPreuves';
import { useCollectiviteId } from '@tet/api/collectivites';

type TAddDocs = (demande_id: number) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
  isLoading: boolean;
  isError: boolean;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers/liens à une fiche action */
export const useAddAnnexe: TAddDocs = (fiche_id: number) => {
  const collectivite_id = useCollectiviteId();
  const { mutate: addPreuve, isPending, isError } = useAddPreuveAnnexe();

  // associe un fichier de la bibliothèque à l'audit
  const addFileFromLib: TAddFileFromLib = (fichier_id) => {
    if (collectivite_id) {
      addPreuve({
        fiche_id,
        collectivite_id,
        commentaire: '',
        fichier_id,
      });
    }
  };

  const addLink: TAddLink = (titre, url) => {
    if (collectivite_id) {
      addPreuve({
        fiche_id,
        collectivite_id,
        commentaire: '',
        titre,
        url,
      });
    }
  };

  return {
    addFileFromLib,
    addLink,
    isLoading: isPending,
    isError: isError,
  };
};
