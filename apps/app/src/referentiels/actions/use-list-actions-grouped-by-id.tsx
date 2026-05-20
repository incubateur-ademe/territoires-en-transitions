import { useQueries } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';
import { ReferentielId } from '@tet/domain/referentiels';

export function useListActionsGroupedById(
  {
    referentielIds,
    collectiviteId,
    includeDesactive = false,
  }: {
    referentielIds: ReferentielId[];
    collectiviteId?: number;
    /** inclut les mesures désactivées par la personnalisation (référentiel TE uniquement) */
    includeDesactive?: boolean;
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
          includeDesactive,
        },
        { enabled, ...DISABLE_AUTO_REFETCH }
      )
    ),
  });
}
