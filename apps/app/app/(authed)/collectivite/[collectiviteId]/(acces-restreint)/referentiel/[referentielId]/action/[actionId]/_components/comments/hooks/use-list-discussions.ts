import {
  ListDiscussionsRequestFilters,
  QueryOptionsType,
} from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useTRPC } from '@tet/api/utils/trpc/client';

export const useListDiscussions = (
  referentielId: ReferentielId,
  filters?: ListDiscussionsRequestFilters,
  options?: QueryOptionsType
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
