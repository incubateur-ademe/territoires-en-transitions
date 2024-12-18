import { trpc } from '@/api/utils/trpc/client';

type MutationOptions = Parameters<
  typeof trpc.collectivites.tableauDeBord.upsert.useMutation
>[0];

/**
 * Save a collectivite module
 */
export const useCollectiviteModuleUpsert = (
  mutationOptions?: MutationOptions
) => {
  const utils = trpc.useUtils();

  return trpc.collectivites.tableauDeBord.upsert.useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      utils.collectivites.tableauDeBord.list.invalidate({
        collectiviteId: data.collectiviteId,
      });

      utils.collectivites.tableauDeBord.get.invalidate({
        collectiviteId: data.collectiviteId,
        id: data.id,
      });
      mutationOptions?.onSuccess?.(data, variables, context);
    },
  });
};
