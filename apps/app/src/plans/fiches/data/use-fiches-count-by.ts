import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

type CountByRequest = RouterInput['plans']['fiches']['countBy'];

export const useFichesCountBy = (
  countByProperty: CountByRequest['countByProperty'],
  params: CountByRequest['filter']
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.plans.fiches.countBy.queryOptions({
      countByProperty,
      collectiviteId,
      filter: params,
    })
  );
};
