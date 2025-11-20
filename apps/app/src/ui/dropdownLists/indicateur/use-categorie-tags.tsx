import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

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
