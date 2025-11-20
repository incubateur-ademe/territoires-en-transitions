import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Démarrer un audit */
export const useStartAudit = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.labellisations.startAudit.mutationOptions({
      onSuccess: (audit) => {
        const { collectiviteId, referentielId } = audit;

        queryClient.invalidateQueries({
          queryKey: ['audit', collectiviteId, referentielId],
        });

        queryClient.invalidateQueries({
          queryKey: ['peut_commencer_audit', collectiviteId, referentielId],
        });

        queryClient.invalidateQueries({
          queryKey: ['labellisation_parcours', collectiviteId],
        });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey(),
        });
      },
    })
  );
};
