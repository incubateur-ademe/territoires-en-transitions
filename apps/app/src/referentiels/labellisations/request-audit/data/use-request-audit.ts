import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useRequestAudit = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    ...trpc.referentiels.labellisations.requestLabellisation.mutationOptions(),
    // toast global neutralisé : le feedback (dont le message d'erreur métier
    // du backend) est géré au point d'appel de la mutation
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
