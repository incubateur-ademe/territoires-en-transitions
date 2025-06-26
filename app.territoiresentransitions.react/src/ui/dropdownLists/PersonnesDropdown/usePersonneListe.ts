import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

export const usePersonneListe = (collectiviteIds?: number[]) => {
  const collectiviteId = useCollectiviteId();

  return trpc.collectivites.personnes.list.useQuery({
    collectiviteIds: collectiviteIds ?? [collectiviteId],
  });
};
