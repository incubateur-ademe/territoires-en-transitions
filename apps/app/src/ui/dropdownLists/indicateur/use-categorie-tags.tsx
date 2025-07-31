import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export const useCategorieTags = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.categories.list.queryOptions(
      {
        collectiviteId,
        withPredefinedTags: true,
      },
      { enabled: Boolean(collectiviteId) }
    )
  );
};
