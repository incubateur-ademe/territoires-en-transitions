import {useQuery} from 'react-query';
import {ApiError, useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';

export enum StatutTrajectoire {
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  DEJA_CALCULE = 'deja_calcule',
  PRET_A_CALCULER = 'pret_a_calculer',
  DONNEES_MANQUANTES = 'donnees_manquantes',
}

export const getStatusKey = (collectiviteId: number | null) => [
  'snbc/verification',
  collectiviteId,
];

type ResponseType = {
  status: StatutTrajectoire;
};

/** Donne le statut du calcul de trajectoire d'une collectivité */
export const useStatutTrajectoire = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();

  return useQuery<ResponseType | null, ApiError>(
    getStatusKey(collectiviteId),
    async () =>
      collectiviteId
        ? api.get<ResponseType>({
            route: '/trajectoires/snbc/verification',
            params: {collectivite_id: collectiviteId},
          })
        : null,
    {
      retry: false,
    }
  );
};
