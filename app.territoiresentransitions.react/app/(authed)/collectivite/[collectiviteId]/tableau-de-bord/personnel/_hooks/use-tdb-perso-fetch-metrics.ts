import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

/** Charge les metrics du tableau de bord personnel */
export const useTdbPersoFetchMetrics = () => {
  const collectiviteId = useCollectiviteId();

  return trpc.metrics.personal.useQuery({
    collectiviteId,
  });
};
