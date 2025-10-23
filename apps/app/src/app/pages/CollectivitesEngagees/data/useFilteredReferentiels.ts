import { CollectiviteEngagee } from '@/api';
import { useUserSession } from '@/api/users/user-context/user-provider';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { getFilterProperties } from './get-filter-properties';

/**
 * Renvoi une liste de collectivités en fonction d'un ensemble de filtres
 * et basée sur les référentiels CAE / ECi
 */
export const useFilteredReferentiels = (args: CollectiviteEngagee.Filters) => {
  const trpc = useTRPC();
  const session = useUserSession();
  const { data, isLoading } = useQuery(
    trpc.collectivites.recherches.referentiels.queryOptions(
      {
        ...args,
        ...getFilterProperties(args),
        trierPar: ['score'],
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
    collectivites: data?.items || [],
    collectivitesCount: data?.count || 0,
  };
};
