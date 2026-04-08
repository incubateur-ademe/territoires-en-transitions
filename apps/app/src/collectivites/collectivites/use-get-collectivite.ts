import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetCollectivite = (collectiviteId: number) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.collectivites.get.queryOptions(
      { collectiviteId, withRelations: false },
      { enabled: Boolean(collectiviteId) }
    )
  );
};
