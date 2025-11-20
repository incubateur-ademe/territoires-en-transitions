import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

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
