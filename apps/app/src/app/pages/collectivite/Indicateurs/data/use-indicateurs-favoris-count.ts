import { useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useQuery } from '@tanstack/react-query';

/** Charge le nombre d'indicateurs favoris de la collectivité */
export const useIndicateursFavorisCount = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.definitions.getFavorisCount.queryOptions({
      collectiviteId,
    })
  );
};
