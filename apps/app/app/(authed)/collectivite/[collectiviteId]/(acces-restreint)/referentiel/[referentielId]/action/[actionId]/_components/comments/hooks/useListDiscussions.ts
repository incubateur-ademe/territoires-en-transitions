import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import {
  ListDiscussionsRequestFilters,
  QueryOptionsType,
} from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';

export type Discussion = RouterOutput['collectivites']['discussions']['list'];
type BackendDiscussion = Discussion['data'][number];
type BackendMessage = BackendDiscussion['messages'][number];

/**
 * Charge les discussions d'une action en fonction de leur statut
 */
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
