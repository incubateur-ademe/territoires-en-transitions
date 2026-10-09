import { QueryObserverResult, useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { PlanStatus, PlanStatusEnum } from '@tet/domain/plans';

export type PlanListItem =
  RouterOutput['plans']['plans']['list']['plans'][number];

type ListPlansOutput = RouterOutput['plans']['plans']['list'];

const IMPORTING_PLANS_REFETCH_INTERVAL_MS = 5_000;

export const useListPlans = (
  collectiviteId: number,
  {
    typeIds,
    statuses,
    limit,
    page,
    sort,
    enabled,
  }: {
    typeIds?: number[];
    /** Par défaut, les plans en cours d'import ou en échec sont écartés. */
    statuses?: readonly PlanStatus[];
    limit?: number;
    page?: number;
    sort?: {
      field: 'nom' | 'createdAt' | 'type';
      direction: 'asc' | 'desc';
    };
    enabled?: boolean;
  } = {}
): {
  plans: PlanListItem[];
  totalCount: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<QueryObserverResult<ListPlansOutput, unknown>>;
} => {
  const trpc = useTRPC();

  const { data, isLoading, error, refetch } = useQuery(
    trpc.plans.plans.list.queryOptions(
      {
        collectiviteId,
        typeIds,
        statuses: statuses ? [...statuses] : undefined,
        limit,
        page,
        sort,
      },
      {
        enabled,
        // Un plan en cours d'import change de statut sans action de l'écran.
        refetchInterval: (query) =>
          query.state.data?.plans.some(
            (plan) => plan.status === PlanStatusEnum.IMPORTING
          )
            ? IMPORTING_PLANS_REFETCH_INTERVAL_MS
            : false,
      }
    )
  );

  return {
    plans: data?.plans ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error,
    refetch,
  };
};
