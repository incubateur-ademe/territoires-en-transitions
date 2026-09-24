import { appLabels } from '@/app/labels/catalog';
import { AddFileHandler } from '@/app/collectivites/documents/add-document/add-file';
import { useAddPreuveLabellisation } from '@/app/collectivites/documents/use-add-preuves';
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
  addFile: AddFileHandler;
} => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { parcours } = useCycleLabellisation(referentielId);
  const { mutateAsync: addPreuve } = useAddPreuveLabellisation(
    collectiviteId,
    referentielId
  );
  const { setToast } = useToastContext();

  const addFile: AddFileHandler = async (fichierId) => {
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

      return { documentId: preuve.id };
    } catch (error) {
      setToast('error', appLabels.mutationError);
      throw error;
    }
  };

  return {
    addFile,
  };
};
