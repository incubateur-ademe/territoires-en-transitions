import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useReferentielId } from '../referentiel-context';
import { useCycleLabellisation } from './useCycleLabellisation';

export const useRemovePreuveFromDemande = (): {
  removePreuve: (preuveId: number) => void;
} => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { parcours } = useCycleLabellisation(referentielId);
  const { setToast } = useToastContext();

  const { mutate } = useMutation(
    trpc.collectivites.documents.removePreuve.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
            collectiviteId,
            referentielId,
          }),
        });

        const demandeId = parcours?.demande?.id;
        if (!demandeId) {
          return;
        }
        await queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.labellisations.listPreuvesLabellisation.queryKey(
              { demandeId }
            ),
        });
      },
      onError: () => setToast('error', appLabels.mutationError),
    })
  );

  const removePreuve = (preuveId: number): void => {
    const demandeId = parcours?.demande?.id;
    if (!demandeId) {
      setToast('error', appLabels.acteEngagementNoDemandeError);
      return;
    }
    mutate({ preuveId, preuveType: 'labellisation' });
  };

  return { removePreuve };
};
