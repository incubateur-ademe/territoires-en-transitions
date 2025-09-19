import { useCollectiviteId } from '@/api/collectivites';
import { RouterInput, useTRPC } from '@/api/utils/trpc/client';
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

      queryClient.invalidateQueries({
        queryKey: trpc.indicateurs.list.queryKey({
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

      if (variables.pilotes) {
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.listPilotes.queryKey({
            collectiviteId,
          }),
        });
      }

      if (variables.services) {
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.listServices.queryKey({
            collectiviteId,
            indicateurId,
          }),
        });
      }

      if (variables.thematiques) {
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.listThematiques.queryKey({
            collectiviteId,
            indicateurId,
          }),
        });
      }

      if (variables.ficheIds) {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listResumes.queryKey({
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
