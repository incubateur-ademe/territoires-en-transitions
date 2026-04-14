import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

export type ListDiscussionsInput =
  RouterInput['collectivites']['discussions']['list'];

export type DiscussionListItem =
  RouterOutput['collectivites']['discussions']['list']['discussions'][number];

type QueryOptions = ListDiscussionsInput['options'];
type Filters = ListDiscussionsInput['filters'];

export const useListDiscussions = (
  referentielId: ReferentielId,
  filters?: Filters,
  options?: QueryOptions
) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.discussions.list.queryOptions({
      collectiviteId,
      referentielId,
      filters,
      options,
    })
  );
};
