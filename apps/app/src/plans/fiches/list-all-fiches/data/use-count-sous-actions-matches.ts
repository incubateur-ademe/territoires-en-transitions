import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  hasSousActionFieldFilters,
  ListFichesRequestFilters,
} from '@tet/domain/plans';

export type SousActionsMatches = {
  sousActionsCount: number;
  actionsCount: number;
};

/**
 * K sous-actions qui satisfont les filtres sur leurs propres champs, dans M
 * actions. N'interroge le serveur que si l'un de ces filtres est actif.
 */
export const useCountSousActionsMatches = ({
  collectiviteId,
  filters,
  enabled = true,
}: {
  collectiviteId: number;
  filters: ListFichesRequestFilters;
  enabled?: boolean;
}) => {
  const trpc = useTRPC();
  const isRelevant = hasSousActionFieldFilters(filters);
  const { data } = useQuery(
    trpc.plans.fiches.countSousActionsMatches.queryOptions(
      { collectiviteId, filters },
      { enabled: enabled && isRelevant }
    )
  );
  return isRelevant ? data : undefined;
};
