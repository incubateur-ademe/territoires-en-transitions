import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useApiClient } from '@/app/core-logic/api/useApiClient';

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
export const useStatutTrajectoire = (enabled: boolean = true) => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();

  return trpc.indicateurs.trajectoires.snbc.checkStatus.useQuery(
    {
      collectiviteId,
    },
    {
      enabled: enabled && !!collectiviteId,
    }
  );
};
