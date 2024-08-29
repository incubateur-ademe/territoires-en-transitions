import {useMutation, useQueryClient} from 'react-query';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';

type ValeurIndicateur = {
  id?: number;
  indicateur_id: number;
  date_valeur: string;
  resultat?: number | null;
  resultat_commentaire?: string | null;
  objectif?: number | null;
  objectif_commentaire?: string | null;
  metadonnee_id?: number | null;
};

// renvoie une fonction de modification de ValeurIndicateur
export const useUpsertValeurIndicateur = () => {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(
    async (valeurIndicateur: ValeurIndicateur) => {
      return collectivite_id
        ? api.post({
            route: '/indicateurs',
            params: {valeurs: [{collectivite_id, ...valeurIndicateur}]},
          })
        : null;
    },
    {
      mutationKey: 'upsert_valeur_indicateur',
      onSuccess: (...args) => {
        queryClient.invalidateQueries(['indicateur_valeurs', collectivite_id]);
      },
    }
  );
};
