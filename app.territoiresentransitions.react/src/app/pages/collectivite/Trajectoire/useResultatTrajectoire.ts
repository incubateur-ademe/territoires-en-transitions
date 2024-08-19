import {
  getKey,
  ResultatTrajectoire,
} from 'app/pages/collectivite/Trajectoire/useCalculTrajectoire';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';

/** Charge la trajectoire */
export const useResultatTrajectoire = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();

  return useQuery(
    getKey(collectiviteId),
    async () =>
      collectiviteId &&
      api.get<ResultatTrajectoire>({
        route: '/trajectoires/snbc',
        params: {collectivite_id: collectiviteId},
      }),
    {
      retry: false,
      refetchOnMount: false,
    }
  );
};
