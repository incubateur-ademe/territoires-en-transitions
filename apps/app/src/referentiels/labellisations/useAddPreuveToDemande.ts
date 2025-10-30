import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TAddFileFromLib } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { useAddPreuveLabellisation } from '@/app/referentiels/preuves/useAddPreuves';
import { LabellisationDemande, ReferentielId } from '@/domain/referentiels';
import { useReferentielId } from '../referentiel-context';
import { useCycleLabellisation } from './useCycleLabellisation';

type TAddDocs = () => {
  /** ajoute un fichier sélectionné depuis la bibliothèque */
  addFileFromLib: TAddFileFromLib;
};

/** Renvoie les gestionnaires d'événements du dialogue d'ajout de
 * fichiers au parcours de labellisation en cours */
export const useAddPreuveToDemande: TAddDocs = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const { mutate: addPreuve } = useAddPreuveLabellisation();
  const { parcours } = useCycleLabellisation(referentiel);
  const supabase = useSupabase();

  // associe un fichier de la bibliothèque à la demande
  const addFileFromLib: TAddFileFromLib = async (fichier_id) => {
    if (collectivite_id) {
      const args = {
        collectivite_id,
        commentaire: '',
        fichier_id,
      };

      const demande_id = parcours?.demande?.id;
      if (demande_id) {
        addPreuve({ ...args, demande_id });
      } else {
        const demande = await createDemande(
          supabase,
          collectivite_id,
          referentiel
        );
        if (demande?.id) {
          addPreuve({ ...args, demande_id: demande.id });
        }
      }
    }
  };
  return {
    addFileFromLib,
  };
};

// charge la demande (ou la crée) associée au parcours de labellisation d'une
// collectivité pour un référentiel et un niveau
const createDemande = async (
  supabase: DBClient,
  collectivite_id: number | null,
  referentiel: ReferentielId | null
) => {
  if (!collectivite_id || !referentiel) {
    return null;
  }
  const { error, data } = await supabase
    .rpc('labellisation_demande', {
      collectivite_id,
      referentiel,
    })
    .select();

  // cast retour de la rpc car le typage généré n'est pas bon (tableau au lieu d'élément unique)
  return error || !data ? null : (data as unknown as LabellisationDemande);
};
