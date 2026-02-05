import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { ListFichesOutput } from '../../fiches/list-all-fiches/data/use-list-fiches';

export const useCreateSousAction = (
  parentId: FicheWithRelations['parentId']
) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const mutationOptions = trpc.plans.fiches.create.mutationOptions();

  return useMutation({
    mutationKey: mutationOptions.mutationKey,

    mutationFn: async () => {
      return mutationOptions.mutationFn?.({
        fiche: { collectiviteId, parentId, statut: null },
      });
    },

    onSuccess: (createdFiche) => {
      queryClient.setQueriesData(
        trpc.plans.fiches.listFiches.queryFilter({
          collectiviteId,
        }),
        (previous: ListFichesOutput | undefined) => {
          if (!previous)
            return {
              data: [createdFiche],
            };
          return {
            ...previous,
            data: [...(previous.data ?? []), createdFiche],
          };
        }
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.queryKey(),
      });
    },
  });
};
