import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ListFichesOutput } from '../../fiches/list-all-fiches/data/use-list-fiches';

type Args = Partial<{
  onUpdateCallback: () => void;
}>;

export type UpdateFicheInput = RouterInput['plans']['fiches']['update'];

export const useUpdateSousAction = (args?: Args) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.fiches.update.mutationOptions({
      onMutate: async ({ ficheId, ficheFields }) => {
        const queryKeyOfListSousActions = trpc.plans.fiches.listFiches.queryKey(
          {
            collectiviteId,
          }
        );

        await queryClient.cancelQueries({
          queryKey: queryKeyOfListSousActions,
        });

        const previousList = queryClient.getQueryData(
          queryKeyOfListSousActions
        );

        queryClient.setQueriesData(
          trpc.plans.fiches.listFiches.queryFilter({
            collectiviteId,
          }),
          (previous: ListFichesOutput | undefined) => {
            if (!previous)
              return {
                data: [{ ...ficheFields, id: ficheId }],
              };
            return {
              ...previous,
              data: (previous.data ?? []).map((fiche) =>
                fiche.id === ficheId ? { ...fiche, ...ficheFields } : fiche
              ),
            };
          }
        );

        return { previousList };
      },

      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.metrics.users.getMetrics.queryKey(),
        });
      },

      onSuccess: () => {
        if (args?.onUpdateCallback) {
          args.onUpdateCallback();
        }
      },
    })
  );
};
