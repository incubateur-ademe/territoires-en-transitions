import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

/** Charge les metrics du tableau de bord personnel */
export const useTdbCollectiviteFetchMetrics = () => {
  const collectiviteId = useCollectiviteId();

  return trpc.metrics.collectivite.useQuery({
    collectiviteId,
  });
};
