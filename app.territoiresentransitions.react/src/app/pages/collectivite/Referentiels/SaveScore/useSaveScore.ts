import { trpc } from '@/api/utils/trpc/client';

export const useSaveSnapshot = () => {
  const utils = trpc.useUtils();

  return trpc.referentiels.snapshots.computeAndUpsert.useMutation({
    onSuccess: (_, { collectiviteId, referentielId }) => {
      utils.referentiels.snapshots.list.invalidate({
        collectiviteId,
        referentielId,
      });
    },
    meta: {
      success: 'État des lieux figé avec succès',
      error:
        "Une sauvegarde de l'état des lieux à cette date et/ou avec ce nom existe déjà.",
    },
  });
};
