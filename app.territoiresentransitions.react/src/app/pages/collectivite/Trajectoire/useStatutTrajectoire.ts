import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';

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

/** Donne le statut du calcul de trajectoire d'une collectivité */
export const useStatutTrajectoire = (enabled = true) => {
  const collectiviteId = useCollectiviteId();

  return trpc.indicateurs.trajectoires.snbc.checkStatus.useQuery(
    {
      collectiviteId,
    },
    {
      enabled: enabled && !!collectiviteId,
    }
  );
};
