import { trpc } from '@/api/utils/trpc/client';

/**
 * Charge les étapes d'une fiche action
 */
export const useDeleteEtape = () => {
  const utils = trpc.useUtils();

  return trpc.plans.fiches.etapes.delete.useMutation({
    onSuccess: () => {
      utils.plans.fiches.etapes.list.invalidate();
    },
  });
};
