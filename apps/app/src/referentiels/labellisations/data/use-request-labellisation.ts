import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useRequestLabellisation = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    ...trpc.referentiels.labellisations.requestLabellisation.mutationOptions(),
    meta: { disableToast: true },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
          collectiviteId: variables.collectiviteId,
          referentielId: variables.referentiel,
        }),
      });
    },
  });
};
