import { ApiError, useApiClient } from '@/app/core-logic/api/useApiClient';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useQuery } from 'react-query';

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
            params: { collectiviteId },
          })
        : null,
    {
      retry: false,
    }
  );
};
