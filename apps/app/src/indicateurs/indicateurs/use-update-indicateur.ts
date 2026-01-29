import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

type DefinitionFieldsInput =
  RouterInput['indicateurs']['indicateurs']['update']['indicateurFields'];

export const useUpdateIndicateur = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { setToast } = useToastContext();

  const mutationOptions = trpc.indicateurs.indicateurs.update.mutationOptions();

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
        queryKey: trpc.indicateurs.indicateurs.list.queryKey({
          collectiviteId,
        }),
      });

      if (variables.estFavori) {
        setToast('success', 'L’indicateur a bien été ajouté aux favoris');
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.indicateurs.getFavorisCount.queryKey({
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
      error: "L'indicateur n'a pas pu être mis à jour",
    },
  });
};
