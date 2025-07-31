import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** Valider un audit */
export const useValidateAudit = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.referentiels.labellisations.validateAudit.mutationOptions({
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

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey(),
        });
      },
    })
  );
};
