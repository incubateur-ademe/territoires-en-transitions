import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useEnvoiDemande = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    ...trpc.referentiels.labellisations.requestLabellisation.mutationOptions(),

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
          collectiviteId: variables.collectiviteId,
          referentielId: variables.referentiel,
        }),
      });
    },
  });
};
