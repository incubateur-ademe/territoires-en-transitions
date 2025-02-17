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

      mutationOptions?.onSuccess?.(data, variables, context);
    },
    meta: {
      success: 'État des lieux figé avec succès',
      error:
        "Une sauvegarde de l'état des lieux à cette date et/ou avec ce nom existe déjà.",
    },
  });
};
