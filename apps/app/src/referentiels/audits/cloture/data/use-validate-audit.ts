import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useRouter } from 'next/navigation';

export const useValidateAudit = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

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

        router.refresh();
      },
    })
  );
};
