import { trpc } from '@/api/utils/trpc/client';
import { useQueryClient } from '@tanstack/react-query';

/** Démarrer un audit */
export const useStartAudit = () => {
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  return trpc.referentiels.labellisations.startAudit.useMutation({
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

      trpcUtils.referentiels.labellisations.getParcours.invalidate({
        collectiviteId,
        referentielId,
      });
    },
  });
};
