import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ListDiscussionsRequestFilters,
  QueryOptionsType,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

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
