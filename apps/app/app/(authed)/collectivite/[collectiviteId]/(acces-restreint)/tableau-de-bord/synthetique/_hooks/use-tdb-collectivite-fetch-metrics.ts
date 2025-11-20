import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/** Charge les metrics du tableau de bord personnel */
export const useTdbCollectiviteFetchMetrics = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.metrics.collectivite.queryOptions({
      collectiviteId,
    })
  );
};
