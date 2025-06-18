import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

export const usePersonneListe = () => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.collectivites.personnes.list.useQuery({
    collectiviteId,
  });
};
