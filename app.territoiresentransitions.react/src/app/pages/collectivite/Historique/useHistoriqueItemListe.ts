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

  // recharge les données lors de la mise à jour de la table des modifications
  const refetch = () => {
    queryClient.invalidateQueries(['historique', collectivite_id]);
  };

  // souscrit aux changements dans la base
  const subscribe = () =>
    supabaseClient
      .from('action_statut,action_commentaire')
      .on('INSERT', refetch)
      .on('UPDATE', refetch)
      .subscribe();

  useEffect(() => {
    const subscription = subscribe();

    // supprime la souscription quand le composant est démonté
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const {data} = useQuery<THistoriqueItem[] | null>(
    ['historique', collectivite_id, action_id],
    () => fetchHistorique(collectivite_id, action_id)
  );
  return data || [];
};
