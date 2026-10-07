import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import useSWR from 'swr';

const trpcClient = getSiteTrpcClient();

export const useFilteredCollectivites = (search: string) => {
  return useSWR(`site-collectivites-filtered-${search}`, async () => {
    const filteredCollectivites =
      await trpcClient.collectivites.site.searchCollectivites.query({
        search,
      });

    if (!filteredCollectivites.length) {
      return null;
    }

    return { filteredCollectivites };
  });
};
