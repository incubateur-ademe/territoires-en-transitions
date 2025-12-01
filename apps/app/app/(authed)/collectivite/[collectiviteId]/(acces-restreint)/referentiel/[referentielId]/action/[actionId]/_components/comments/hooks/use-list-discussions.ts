import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

export type ListDiscussionsInput =
  RouterInput['collectivites']['discussions']['list'];

type QueryOptions = ListDiscussionsInput['options'];
type Filters = ListDiscussionsInput['filters'];

export const useListDiscussions = (
  referentielId: ReferentielId,
  filters?: Filters,
  options?: QueryOptions
) => {
  const collectivite_id = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.discussions.list.queryOptions({
      collectiviteId: collectivite_id,
      referentielId: referentielId,
      filters,
      options,
    })
  );
};
