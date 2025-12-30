import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';

export type CreateIndicateurDefinitionInput =
  RouterInput['indicateurs']['indicateurs']['create'];

export const useCreateIndicateurDefinition = (options?: {
  onSuccess: (indicateurId: number) => void;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.indicateurs.indicateurs.create.mutationOptions({
      meta: {
        success: "L'indicateur est enregistré",
        error: "L'indicateur n'a pas été enregistré",
      },
      onSuccess: (indicateurId, { collectiviteId, ficheId }) => {
        if (ficheId) {
          queryClient.invalidateQueries({
            queryKey: trpc.plans.fiches.get.queryKey({
              id: ficheId,
            }),
          });

          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.indicateurs.list.queryKey({
              collectiviteId,
              filters: {
                ficheIds: [ficheId],
              },
            }),
          });
        }

        if (indicateurId) {
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.indicateurs.list.queryKey({
              collectiviteId,
              filters: {
                indicateurIds: [indicateurId],
              },
            }),
          });
        }

        if (options?.onSuccess && indicateurId) {
          options.onSuccess(indicateurId);
        }
      },
    })
  );
};
