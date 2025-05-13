import { trpc } from '@/api/utils/trpc/client';
import { Fiche } from '@/domain/plans/fiches';

/**
 * Charge les étapes d'une fiche action
 */
export const useGetEtapes = (
  { id: ficheId }: Pick<Fiche, 'id'>,
  requested = true
) => {
  return trpc.plans.fiches.etapes.list.useQuery(
    { ficheId },
    { enabled: requested }
  );
};
