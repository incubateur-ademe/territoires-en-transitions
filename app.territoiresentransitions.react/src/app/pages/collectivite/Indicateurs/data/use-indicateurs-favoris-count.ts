import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

/** Charge le nombre d'indicateurs favoris de la collectivité */
export const useIndicateursFavorisCount = () => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.indicateurs.definitions.getFavorisCount.useQuery({
    collectiviteId,
  });
};
