import { CollectiviteEngagee, useTRPC } from '@/api';
import { useUserSession } from '@/api/users';
import { useQuery } from '@tanstack/react-query';
import { getFilterProperties } from './get-filter-properties';

/**
 * Renvoi une liste de plans en fonction d'un ensemble de filtres
 */
export const useFilteredPlans = (args: CollectiviteEngagee.Filters) => {
  const trpc = useTRPC();
  const session = useUserSession();
  const { data, isLoading } = useQuery(
    trpc.collectivites.recherches.plans.queryOptions(
      {
        ...args,
        ...getFilterProperties(args),
        trierPar: ['nom'],
      },
      {
        //race condition with session that makes the call starts with anonymous user
        //so we need to wait for the session to be set - to be fixed
        enabled: !!session,
      }
    )
  );
  return {
    isLoading: isLoading || !session,
    plans: data?.items || [],
    plansCount: data?.count || 0,
  };
};
