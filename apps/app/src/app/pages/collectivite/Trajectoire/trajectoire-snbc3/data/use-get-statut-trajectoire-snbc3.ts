import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/** Disponibilité de la trajectoire SNBC 3 pour la collectivité courante. */
export const useGetStatutTrajectoireSnbc3 = () => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.trajectoires.snbc3.checkStatus.queryOptions(
      { collectiviteId },
      { enabled: !!collectiviteId }
    )
  );
};
