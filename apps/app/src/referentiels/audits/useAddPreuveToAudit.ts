import { useCollectiviteId } from '@/api/collectivites';
import { TAddFileFromLib } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { useAddPreuveAudit } from '@/app/referentiels/preuves/useAddPreuves';

type TAddDocs = (demande_id: number) => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers à l'audit en cours */
export const useAddPreuveToAudit: TAddDocs = (audit_id: number) => {
  const collectivite_id = useCollectiviteId();
  const { mutate: addPreuve } = useAddPreuveAudit();

  // associe un fichier de la bibliothèque à l'audit
  const addFileFromLib: TAddFileFromLib = (fichier_id) => {
    if (collectivite_id) {
      addPreuve({
        audit_id,
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
