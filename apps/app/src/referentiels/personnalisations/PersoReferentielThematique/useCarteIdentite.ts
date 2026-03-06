import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useCarteIdentite = (collectiviteId: number) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.collectivites.get.queryOptions(
      { collectiviteId: collectiviteId ?? undefined },
      { enabled: Boolean(collectiviteId) }
    )
  );
};
