import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useReferentielId } from '../referentiel-context';
import { useCycleLabellisation } from './useCycleLabellisation';

export const useRemovePreuveFromDemande = (): {
  removePreuve: (preuveId: number) => Promise<void>;
} => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const trpcClient = useTRPCClient();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { parcours } = useCycleLabellisation(referentielId);
  const { setToast } = useToastContext();

  const removePreuve = async (preuveId: number): Promise<void> => {
    const demandeId = parcours?.demande?.id;
    if (!demandeId) {
      setToast('error', appLabels.acteEngagementNoDemandeError);
      return;
    }
    try {
      await trpcClient.collectivites.documents.removePreuve.mutate({
        preuveId,
        preuveType: 'labellisation',
      });
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
    } catch {
      setToast('error', appLabels.mutationError);
    }
  };

  return { removePreuve };
};
