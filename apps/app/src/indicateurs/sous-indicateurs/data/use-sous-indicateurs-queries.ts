import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  COLLECTIVITE_SOURCE_ID,
  type IndicateurTotalAtDate,
} from '@tet/domain/indicateurs';
import { chunk } from 'es-toolkit';
import { useMemo } from 'react';
import { useListIndicateurValeurs } from '../../valeurs/use-list-indicateur-valeurs';
import {
  toQueryOutcome,
  toTotalsOutcome,
  type ParentTotals,
  type SousIndicateursOutcomes,
} from '../sous-indicateurs-table-state.rules';
import {
  toSousIndicateurNode,
  type SousIndicateurNode,
} from '../sous-indicateurs-table.rules';
import { listNodesFromIds } from './list-nodes-from-ids';
import { toNodesQueryKey } from './to-nodes-query-key';

const NODES_PAGE_SIZE = 50;
const NODES_STALE_TIME_MS = 5 * 60 * 1000;

export const useSousIndicateursQueries = (
  indicateurId: number
): SousIndicateursOutcomes => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const fetchNodesByIds = async (
    ids: readonly number[]
  ): Promise<SousIndicateurNode[]> => {
    const pages = await Promise.all(
      chunk([...ids], NODES_PAGE_SIZE).map((pageIds) =>
        queryClient.fetchQuery({
          ...trpc.indicateurs.indicateurs.list.queryOptions({
            collectiviteId,
            filters: { indicateurIds: pageIds },
            queryOptions: { page: 1, limit: NODES_PAGE_SIZE },
          }),
          staleTime: NODES_STALE_TIME_MS,
          retry: false,
        })
      )
    );
    return pages.flatMap(({ data }) => data.map(toSousIndicateurNode));
  };

  const nodesQuery = useQuery({
    queryKey: toNodesQueryKey({
      listQueryKey: trpc.indicateurs.indicateurs.list.queryKey({
        collectiviteId,
      }),
      indicateurId,
    }),
    queryFn: () =>
      listNodesFromIds({
        ids: [indicateurId],
        visitedIds: new Set(),
        listNodesByIds: fetchNodesByIds,
      }),
    staleTime: NODES_STALE_TIME_MS,
  });

  const nodes = useMemo(() => nodesQuery.data ?? [], [nodesQuery.data]);
  const descendantIds = useMemo(
    () => nodes.filter(({ id }) => id !== indicateurId).map(({ id }) => id),
    [nodes, indicateurId]
  );
  const parentIds = useMemo(
    () =>
      nodes.filter(({ enfantIds }) => enfantIds.length > 0).map(({ id }) => id),
    [nodes]
  );

  const valeursQuery = useListIndicateurValeurs(
    { indicateurIds: descendantIds, sources: [COLLECTIVITE_SOURCE_ID] },
    { enabled: descendantIds.length > 0 }
  );

  const totals = useQueries({
    queries: parentIds.map((parentId) => ({
      ...trpc.indicateurs.valeurs.totals.queryOptions({
        collectiviteId,
        indicateurId: parentId,
      }),
      select: (
        totalsAtDates: readonly IndicateurTotalAtDate[]
      ): ParentTotals => ({
        indicateurId: parentId,
        totals: totalsAtDates,
      }),
    })),
    combine: toTotalsOutcome,
  });

  return useMemo(
    () => ({
      collectiviteId,
      nodes: toQueryOutcome({
        isError: nodesQuery.isError,
        data: nodesQuery.data,
      }),
      valeurs: toQueryOutcome({
        isError: valeursQuery.isError,
        data: valeursQuery.data?.indicateurs,
      }),
      totals,
    }),
    [
      collectiviteId,
      nodesQuery.isError,
      nodesQuery.data,
      valeursQuery.isError,
      valeursQuery.data,
      totals,
    ]
  );
};
