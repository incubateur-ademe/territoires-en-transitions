import { RouterInput, useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type CreateIndicateurDefinitionInput =
  RouterInput['indicateurs']['definitions']['create'];

export const useCreateIndicateurDefinition = (options?: {
  onSuccess: (indicateurId: number) => void;
}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.indicateurs.definitions.create.mutationOptions({
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
            queryKey: trpc.indicateurs.definitions.list.queryKey({
              collectiviteId,
              filters: {
                ficheIds: [ficheId],
              },
            }),
          });
        }

        if (indicateurId) {
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.definitions.list.queryKey({
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
