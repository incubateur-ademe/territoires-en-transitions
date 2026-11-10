import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/** Trajectoire SNBC 3 importée de la collectivité courante (aucun calcul). */
export const useGetTrajectoireSnbc3 = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.trajectoires.snbc3.get.queryOptions(
      { collectiviteId },
      { enabled: !!collectiviteId, retry: false }
    )
  );
};
