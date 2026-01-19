import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { ListFichesOutput } from '../../fiches/list-all-fiches/data/use-list-fiches';
import { sortSousActionsByTitleOrCreationDateWithoutTitle } from './utils';

type Args = Partial<{
  onUpdateCallback: () => void;
}>;

export type UpdateFicheInput = RouterInput['plans']['fiches']['update'];

export const useUpdateSousAction = (args?: Args) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isNotificationEnabled = useFeatureFlagEnabled(
    'is-notification-enabled'
  );

  const mutationOptions = trpc.plans.fiches.update.mutationOptions();

  return useMutation({
    mutationFn: async (input: UpdateFicheInput) => {
      return mutationOptions.mutationFn?.({ ...input, isNotificationEnabled });
    },

    meta: { disableSuccess: true },

    onMutate: async ({ ficheId, ficheFields }) => {
      const queryKeyOfListSousActions = trpc.plans.fiches.listFiches.queryKey({
        collectiviteId,
      });

      await queryClient.cancelQueries({
        queryKey: queryKeyOfListSousActions,
      });

      const previousList = queryClient.getQueryData(queryKeyOfListSousActions);

      queryClient.setQueriesData(
        trpc.plans.fiches.listFiches.queryFilter({
          collectiviteId,
        }),
        (previous: ListFichesOutput) => {
          return {
            ...previous,
            data: sortSousActionsByTitleOrCreationDateWithoutTitle(
              (previous.data ?? []).map((fiche) =>
                fiche.id === ficheId ? { ...fiche, ...ficheFields } : fiche
              )
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
    },

    onSuccess: () => {
      if (args?.onUpdateCallback) {
        args.onUpdateCallback();
      }
    },
  });
};
