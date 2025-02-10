import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

/** Charge le nombre d'indicateurs favoris de la collectivité */
export const useIndicateursFavorisCount = () => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.indicateurs.definitions.getFavorisCount.useQuery({
    collectiviteId,
  });
};
