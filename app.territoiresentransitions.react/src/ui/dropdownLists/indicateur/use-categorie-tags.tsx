import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '../../../core-logic/hooks/params';

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
