import { useCollectiviteId } from '@/api/collectivites';
import { useApiClient } from '@/app/core-logic/api/useApiClient';
import { useMutation, useQueryClient } from 'react-query';

type ValeurIndicateur = {
  id?: number;
  indicateurId: number;
  dateValeur: string;
  resultat?: number | null;
  resultatCommentaire?: string | null;
  objectif?: number | null;
  objectifCommentaire?: string | null;
  metadonneeId?: number | null;
};

// renvoie une fonction de modification de ValeurIndicateur
export const useUpsertValeurIndicateur = () => {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const collectiviteId = useCollectiviteId();

  return useMutation(
    async (valeurIndicateur: ValeurIndicateur) => {
      return collectiviteId
        ? api.post({
            route: '/indicateurs',
            params: { valeurs: [{ collectiviteId, ...valeurIndicateur }] },
          })
        : null;
    },
    {
      mutationKey: 'upsert_valeur_indicateur',
      onSuccess: (...args) => {
        queryClient.invalidateQueries(['indicateur_valeurs', collectiviteId]);
      },
    }
  );
};
