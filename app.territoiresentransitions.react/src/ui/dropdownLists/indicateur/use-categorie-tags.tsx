import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

export const useCategorieTags = () => {
  const collectiviteId = useCollectiviteId();
  if (!collectiviteId) {
    return { data: null };
  }

  return trpc.collectivites.categories.list.useQuery({
    collectiviteId,
    withPredefinedTags: true,
  });
};
