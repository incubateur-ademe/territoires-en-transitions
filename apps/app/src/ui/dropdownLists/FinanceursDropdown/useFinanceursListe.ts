import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { TagEnum } from '@tet/domain/collectivites';

export const useFinanceursListe = (collectiviteIds?: number[]) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.tags.list.list.queryOptions({
      tagType: TagEnum.Financeur,
      ...(collectiviteIds ? { collectiviteIds } : { collectiviteId }),
    })
  );
};
