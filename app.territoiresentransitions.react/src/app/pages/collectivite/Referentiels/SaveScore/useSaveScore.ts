import { trpc } from '@/api/utils/trpc/client';

type MutationOptions = Parameters<
  typeof trpc.referentiels.snapshots.upsert.useMutation
>[0];

export const useSaveScore = (mutationOptions?: MutationOptions) => {
  const utils = trpc.useUtils();

  return trpc.referentiels.snapshots.upsert.useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      utils.referentiels.snapshots.listSummary.invalidate({
        collectiviteId: data.collectiviteId,
        referentielId: data.referentielId,
      });

      utils.collectivites.tableauDeBord.get.invalidate({
        collectiviteId: data.collectiviteId,
        id: data.id,
      });*/
      mutationOptions?.onSuccess?.(data, variables, context);
    },
  });
};
