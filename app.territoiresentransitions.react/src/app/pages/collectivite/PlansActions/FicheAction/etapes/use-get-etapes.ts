import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Charge les étapes d'une fiche action
 */
export const useGetEtapes = (ficheId: number, enabled = true) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.plans.fiches.etapes.list.queryOptions(
      {
        ficheId,
      },
      {
        enabled,
      }
    )
  );
};
