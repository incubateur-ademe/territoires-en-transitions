import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export enum StatutTrajectoire {
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  DEJA_CALCULE = 'deja_calcule',
  PRET_A_CALCULER = 'pret_a_calculer',
  DONNEES_MANQUANTES = 'donnees_manquantes',
}

/** Donne le statut du calcul de trajectoire d'une collectivité */
export const useStatutTrajectoire = (enabled = true) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.trajectoires.snbc.checkStatus.queryOptions(
      {
        collectiviteId,
      },
      {
        enabled: enabled && !!collectiviteId,
      }
    )
  );
};
