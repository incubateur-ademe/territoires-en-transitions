import { trpc } from '@/api/utils/trpc/client';
import { useQueryClient } from 'react-query';

/** Valider un audit */
export const useValidateAudit = () => {
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  return trpc.referentiels.labellisations.validateAudit.useMutation({
    onSuccess: (audit) => {
      queryClient.invalidateQueries(
        ['audit', audit.collectiviteId, audit.referentielId],
        undefined,
        { cancelRefetch: true }
      );
      queryClient.invalidateQueries(
        ['labellisation_parcours', audit.collectiviteId],
        undefined,
        { cancelRefetch: true }
      );

      trpcUtils.referentiels.labellisations.getParcours.invalidate();
    },
  });
};
