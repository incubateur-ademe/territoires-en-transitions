import { useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useQuery } from '@tanstack/react-query';

/** Charge les metrics du tableau de bord personnel */
export const useTdbPersoFetchMetrics = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.metrics.personal.queryOptions({
      collectiviteId,
    })
  );
};
