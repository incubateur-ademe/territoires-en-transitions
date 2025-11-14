import { RouterInput, useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type DefinitionFieldsInput =
  RouterInput['indicateurs']['definitions']['update']['indicateurFields'];

export const useUpdateIndicateurDefinition = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const mutationOptions = trpc.indicateurs.definitions.update.mutationOptions();

  return useMutation({
    mutationKey: mutationOptions.mutationKey,

    mutationFn: async (indicateurFields: DefinitionFieldsInput) => {
      return mutationOptions.mutationFn?.({
        indicateurId,
        collectiviteId,
        indicateurFields,
      });
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.definitions.list.queryKey({
          collectiviteId,
        }),
      });

      if (variables.estFavori) {
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.getFavorisCount.queryKey({
            collectiviteId,
          }),
        });
      }

      if (variables.ficheIds) {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
            filters: {
              indicateurIds: [indicateurId],
            },
          }),
        });
      }
    },
    meta: {
      success: "L'indicateur a été mis à jour",
      error: "L'indicateur n'a pas pu être mis à jour",
    },
  });
};
