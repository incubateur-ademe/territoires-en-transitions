import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import { useQuery } from '@tanstack/react-query';

const trpcClient = getSiteTrpcClient();

export const useFilteredCollectivites = (search: string) =>
  useQuery({
    queryKey: ['site-collectivites-filtered', search],
    queryFn: ({ signal }) =>
      trpcClient.collectivites.site.searchCollectivites.query(
        { search },
        { signal }
      ),
  });
