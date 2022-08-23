import {supabaseClient} from 'core-logic/api/supabase';
import {useEffect} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {THistoriqueItem} from './types';

/**
 * Toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
 */
export const fetchHistorique = async (
  collectivite_id: number,
  action_id?: string
) => {
  // la requête
  let query = supabaseClient
    .from<THistoriqueItem>('historique')
    .select('*')
    .match({collectivite_id})
    .limit(10); // TODO : pagination

  // filtre optionnel par action
  if (action_id) {
    query = query.like('action_id', `${action_id}%`);
  }

  // attends les données
  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// les mutations "écoutées" pour déclencher le rechargement de l'historique
const OBSERVED_MUTATION_KEYS = ['action_statut', 'action_commentaire'];

/**
 * Les dernières modifications d'une collectivité
 */
export const useHistoriqueItemListe = ({
  collectivite_id,
  action_id,
}: {
  collectivite_id: number;
  action_id?: string;
}): THistoriqueItem[] => {
  const queryClient = useQueryClient();

  // recharge les données lors de la mise à jour d'une des mutations écoutées
  const refetch = () => {
    queryClient.invalidateQueries(['historique', collectivite_id]);
  };
  useEffect(() => {
    return queryClient.getMutationCache().subscribe(mutation => {
      if (
        mutation?.state.status === 'success' &&
        OBSERVED_MUTATION_KEYS.includes(mutation.options.mutationKey as string)
      ) {
        refetch();
      }
    });
  }, []);

  const {data} = useQuery<THistoriqueItem[] | null>(
    ['historique', collectivite_id, action_id],
    () => fetchHistorique(collectivite_id, action_id)
  );
  return data || [];
};
