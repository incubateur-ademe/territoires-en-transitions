import { trpc } from '@/api/utils/trpc/client';

import { FicheAction } from '@/api/plan-actions';

/**
 * Charge les étapes d'une fiche action
 */
export const useGetEtapes = (
  { id: ficheId }: Pick<FicheAction, 'id'>,
  requested = true
) => {
  return trpc.plans.fiches.etapes.list.useQuery(
    { ficheId },
    { enabled: requested }
  );
};
