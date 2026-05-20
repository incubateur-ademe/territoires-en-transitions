import { appLabels } from '@/app/labels/catalog';
import { TAddFileFromLib } from '@/app/referentiels/preuves/AddPreuveModal/AddFile';
import { useAddPreuveLabellisation } from '@/app/referentiels/preuves/useAddPreuves';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useReferentielId } from '../referentiel-context';
import { useCycleLabellisation } from './useCycleLabellisation';

export const useAddPreuveToDemande = ({
  replacePreuveId,
}: {
  /**
   * Id de la preuve à remplacer : supprimée APRÈS l'ajout du nouveau fichier.
   * On insère d'abord puis on supprime l'ancienne, de sorte qu'un échec de
   * l'ajout laisse le document original intact (pas de fenêtre de perte de
   * données). On cible une preuve précise plutôt que toutes les preuves de la
   * demande, pour ne pas effacer les autres documents (ex. candidature).
   */
  replacePreuveId?: number;
} = {}): {
  addFileFromLib: TAddFileFromLib;
} => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const trpcClient = useTRPCClient();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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
      // Insertion d'abord : si elle échoue, l'acte original reste en place.
      const created = await addPreuve({ fichierId, commentaire: '', demandeId });

      if (replacePreuveId !== undefined) {
        await trpcClient.collectivites.documents.removePreuve.mutate({
          preuveId: replacePreuveId,
          preuveType: 'labellisation',
        });
        // `addPreuve` a invalidé avant la suppression : on réinvalide pour que
        // l'ancienne preuve disparaisse de la liste et du parcours.
        await queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.labellisations.listPreuvesLabellisation.queryKey({
              demandeId,
            }),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      }

      return created;
    } catch (error) {
      setToast('error', appLabels.mutationError);
      throw error;
    }
  };

  return {
    addFileFromLib,
  };
};
