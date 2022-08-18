import {supabaseClient} from 'core-logic/api/supabase';
import {useEffect} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {THistoriqueItem} from './types';

/**
 * Toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
 */
export const fetchHistorique = async (collectivite_id: number) => {
  // la requête
  const query = supabaseClient
    .from<THistoriqueItem>('historique')
    .select('*')
    .match({collectivite_id})
    .limit(10); // TODO : pagination

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
}: {
  collectivite_id: number;
}): THistoriqueItem[] => {
  const queryClient = useQueryClient();

  // recharge les données lors de la mise à jour de la table des modifications
  const refetch = () => {
    queryClient.invalidateQueries(['historique', collectivite_id]);
  };

  // souscrit aux changements de la table des modifications
  const subscribe = () =>
    supabaseClient
      .from('historique')
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
    ['historique', collectivite_id],
    () => fetchHistorique(collectivite_id)
  );
  return data || [];
};
