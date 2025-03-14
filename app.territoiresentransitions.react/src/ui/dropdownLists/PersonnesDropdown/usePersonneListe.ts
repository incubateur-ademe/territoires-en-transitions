import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

export const usePersonneListe = () => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.collectivites.personnes.list.useQuery({
    collectiviteId,
  });
};
