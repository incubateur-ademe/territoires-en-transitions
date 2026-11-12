import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import { useQuery } from '@tanstack/react-query';

const trpcClient = getSiteTrpcClient();

export const useFilteredCollectivites = (search: string) => {
  return useQuery({
    queryKey: ['site-collectivites-filtered', search],
    queryFn: async () => {
      const filteredCollectivites =
        await trpcClient.collectivites.site.searchCollectivites.query({
          search,
        });

      if (!filteredCollectivites.length) {
        return null;
      }

      return { filteredCollectivites };
    },
  });
};
