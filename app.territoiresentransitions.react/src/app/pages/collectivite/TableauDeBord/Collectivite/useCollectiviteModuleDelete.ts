import { trpc } from '@/api/utils/trpc/client';

type MutationOptions = Parameters<
  typeof trpc.collectivites.tableauDeBord.delete.useMutation
>[0];

/**
 * Delete a collectivite module
 */
export const useCollectiviteModuleDelete = (
  mutationOptions?: MutationOptions
) => {
  const utils = trpc.useUtils();

  return trpc.collectivites.tableauDeBord.delete.useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      utils.collectivites.tableauDeBord.list.invalidate({
        collectiviteId: variables.collectiviteId,
      });

      mutationOptions?.onSuccess?.(data, variables, context);
    },
  });
};
