import { appLabels } from '@/app/labels/catalog';
import { TAddFileFromLib } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { useAddPreuveLabellisation } from '@/app/referentiels/preuves/useAddPreuves';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ObjetPreuve } from '@tet/domain/referentiels';
import { useReferentielId } from '../referentiel-context';
import { useCycleLabellisation } from './useCycleLabellisation';

export const useAddPreuveToDemande = ({
  objet,
}: {
  objet?: ObjetPreuve;
} = {}): {
  addFileFromLib: TAddFileFromLib;
} => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { parcours } = useCycleLabellisation(referentielId);
  const { mutateAsync: addPreuve } = useAddPreuveLabellisation(
    collectiviteId,
    referentielId
  );
  const { setToast } = useToastContext();

  const addFileFromLib: TAddFileFromLib = async (fichierId) => {
    const demandeId = parcours?.demande?.id;
    if (!demandeId) {
      setToast('error', appLabels.acteEngagementNoDemandeError);
      throw new Error('Aucune demande de labellisation en cours');
    }
    try {
      const preuve = await addPreuve({
        fichierId,
        commentaire: '',
        demandeId,
        objet,
      });

      return { preuveId: preuve.id };
    } catch (error) {
      setToast('error', appLabels.mutationError);
      throw error;
    }
  };

  return {
    addFileFromLib,
  };
};
