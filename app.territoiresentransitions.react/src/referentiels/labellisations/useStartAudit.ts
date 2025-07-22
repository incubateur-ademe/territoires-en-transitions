import { trpc } from '@/api/utils/trpc/client';
import { useQueryClient } from 'react-query';

/** Démarrer un audit */
export const useStartAudit = () => {
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  return trpc.referentiels.labellisations.startAudit.useMutation({
    onSuccess: (audit) => {
      const { collectiviteId, referentielId } = audit;

      queryClient.invalidateQueries(['audit', collectiviteId, referentielId]);

      queryClient.invalidateQueries([
        'peut_commencer_audit',
        collectiviteId,
        referentielId,
      ]);

      queryClient.invalidateQueries(['labellisation_parcours', collectiviteId]);

      trpcUtils.referentiels.labellisations.getParcours.invalidate({
        collectiviteId,
        referentielId,
      });
    },
  });
};
