import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export const usePersonneListe = (collectiviteIds?: number[]) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.personnes.list.queryOptions({
      collectiviteIds: collectiviteIds ?? [collectiviteId],
    })
  );
};
