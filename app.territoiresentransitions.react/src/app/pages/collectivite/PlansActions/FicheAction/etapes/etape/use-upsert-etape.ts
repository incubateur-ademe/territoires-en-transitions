import { trpc } from '@tet/api/utils/trpc/client';

/**
 * Charge les étapes d'une fiche action
 */
export const useUpsertEtape = () => {
  const utils = trpc.useUtils();

  return trpc.plans.fiches.etapes.upsert.useMutation({
    onSuccess: () => {
      utils.plans.fiches.etapes.list.invalidate();
    },
  });
};
