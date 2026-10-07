import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PersonalDefaultModuleKeys } from '@tet/domain/metrics';

/**
 * Fetch un module spécifique du tableau de bord personnel de l'utilisateur courant.
 */
export const useTdbPersoFetchSingle = (
  defaultModuleKey: PersonalDefaultModuleKeys
) => {
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  return useQuery(
    trpc.metrics.users.getModule.queryOptions({
      collectiviteId,
      defaultKey: defaultModuleKey,
    })
  );
};
