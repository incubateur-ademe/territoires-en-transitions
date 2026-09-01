import { AddFileFromLibHandler } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { AddLinkHandler } from '@/app/referentiels/preuves/AddPreuveModal/AddLink';
import { useAddPreuveAnnexe } from '@/app/referentiels/preuves/useAddPreuves';
import { useCollectiviteId } from '@tet/api/collectivites';

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers/liens à une fiche action */
export const useAddAnnexe = (
  ficheId: number
): {
  addFileFromLib: AddFileFromLibHandler;
  addLink: AddLinkHandler;
  isLoading: boolean;
  isError: boolean;
} => {
  const collectivite_id = useCollectiviteId();
  const { mutateAsync: addPreuve, isPending, isError } = useAddPreuveAnnexe();

  // associe un fichier de la bibliothèque à l'audit
  const addFileFromLib: AddFileFromLibHandler = async (fichier_id) => {
    if (collectivite_id) {
      const annexe = await addPreuve({
        fiche_id: ficheId,
        collectivite_id,
        commentaire: '',
        fichier_id,
      });

      return { preuveId: annexe.id };
    }
  };

  const addLink: AddLinkHandler = (titre, url) => {
    if (collectivite_id) {
      addPreuve({
        fiche_id: ficheId,
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
