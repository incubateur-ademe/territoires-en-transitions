import { useQueries } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';
import { ReferentielId } from '@tet/domain/referentiels';

export type ActionsGroupedByIdData =
  RouterOutput['referentiels']['actions']['listActionsGroupedById'];

export function useListActionsGroupedById(
  {
    referentielIds,
    collectiviteId,
  }: {
    referentielIds: ReferentielId[];
    collectiviteId?: number;
  },
  { enabled }: { enabled?: boolean } = { enabled: true }
) {
  const trpc = useTRPC();
  const collectiviteIdFromContext = useCollectiviteId();

  return useQueries({
    queries: referentielIds.map((referentielId) =>
      trpc.referentiels.actions.listActionsGroupedById.queryOptions(
        {
          referentielId,
          collectiviteId: collectiviteId ?? collectiviteIdFromContext,
        },
        { enabled, ...DISABLE_AUTO_REFETCH }
      )
    ),
    combine: (results) => {
      const data = new Map<ReferentielId, ActionsGroupedByIdData>();
      referentielIds.forEach((id, i) => {
        const d = results[i]?.data as ActionsGroupedByIdData | undefined;
        if (d != null) data.set(id, d);
      });
      return {
        data,
        isPending: results.some((r) => r.isPending),
        isError: results.some((r) => r.isError),
      };
    },
  });
}
