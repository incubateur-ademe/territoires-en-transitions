import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import {
  ListDiscussionsRequestFilters,
  QueryOptionsType,
} from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';

export const useListDiscussions = (
  referentielId: ReferentielId,
  filters?: ListDiscussionsRequestFilters,
  options?: QueryOptionsType
) => {
  const collectivite_id = useCollectiviteId();
  const trpc = useTRPC();

  const query = useQuery(
    trpc.collectivites.discussions.list.queryOptions({
      collectiviteId: collectivite_id,
      referentielId: referentielId,
      filters,
      options,
    })
  );

  return {
    ...query,
    data: query.data ?? {
      data: [],
      count: 0,
    },
  };
};
