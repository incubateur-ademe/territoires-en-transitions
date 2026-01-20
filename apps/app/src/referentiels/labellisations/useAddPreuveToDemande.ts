import { TAddFileFromLib } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { useAddPreuveLabellisation } from '@/app/referentiels/preuves/useAddPreuves';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useReferentielId } from '../referentiel-context';
import { useCycleLabellisation } from './useCycleLabellisation';

type TAddDocs = () => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers au parcours de labellisation en cours */
export const useAddPreuveToDemande: TAddDocs = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { parcours } = useCycleLabellisation(referentielId);
  const { mutateAsync: addPreuve } = useAddPreuveLabellisation(
    collectiviteId,
    referentielId
  );

  // associe un fichier de la bibliothèque à la demande
  const addFileFromLib: TAddFileFromLib = async (fichierId) => {
    if (collectiviteId && referentielId && parcours?.demande?.id) {
      await addPreuve({
        fichierId,
        commentaire: '',
        demandeId: parcours?.demande?.id,
      });
    }
  };

  return {
    addFileFromLib,
  };
};
