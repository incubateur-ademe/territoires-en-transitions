import { trpc } from '@/api/utils/trpc/client';
import { useQueryClient } from '@tanstack/react-query';

/** Valider un audit */
export const useValidateAudit = () => {
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  return trpc.referentiels.labellisations.validateAudit.useMutation({
    onSuccess: (audit) => {
      queryClient.invalidateQueries(
        {
          queryKey: ['audit', audit.collectiviteId, audit.referentielId],
        },
        { cancelRefetch: true }
      );

      queryClient.invalidateQueries(
        {
          queryKey: ['labellisation_parcours', audit.collectiviteId],
        },
        { cancelRefetch: true }
      );

      trpcUtils.referentiels.labellisations.getParcours.invalidate();
    },
  });
};
