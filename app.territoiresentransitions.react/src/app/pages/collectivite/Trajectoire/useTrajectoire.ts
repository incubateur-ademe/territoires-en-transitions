import {useQuery} from 'react-query';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useApiClient} from 'core-logic/api/useApiClient';

export enum CheckDataSNBCStatus {
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  DEJA_CALCULE = 'deja_calcule',
  PRET_A_CALCULER = 'pret_a_calculer',
  DONNEES_MANQUANTES = 'donnees_manquantes',
}

/** Donne le statut du calcul de trajectoire d'une collectivité */
export const useTrajectoireCheck = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();

  return useQuery(
    ['trajectoireCheck', collectiviteId],
    async () =>
      collectiviteId &&
      api.get<{status: CheckDataSNBCStatus}>({
        route: '/trajectoires/snbc/check',
        params: {collectivite_id: collectiviteId},
      }),
    {
      retry: false,
    }
  );
};
