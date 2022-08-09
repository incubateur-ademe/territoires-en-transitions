import {supabaseClient} from 'core-logic/api/supabase';
import {IHistoricalActionStatutRead} from 'generated/dataLayer/historical_action_statut_read';
import {useEffect} from 'react';
import {useQuery, useQueryClient} from 'react-query';

/**
 * Toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
 */
export const fetchHistoricalActionStatutList = async (
  collectiviteId: number,
  actionId: string
) => {
  // la requête
  const query = supabaseClient
    .from<IHistoricalActionStatutRead>('historical_action_statut')
    .select('*')
    .match({collectivite_id: collectiviteId, action_id: actionId})
    .limit(10); // TODO : pagination

  // attends les données
  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Les dernières modifications des statuts
 */
export const useHistoricalActionStatuts = ({
  collectiviteId,
  actionId,
}: {
  collectiviteId: number;
  actionId: string;
}): IHistoricalActionStatutRead[] => {
  const queryClient = useQueryClient();

  // recharge les données lors de la mise à jour de la table de statuts
  const refetch = () => {
    queryClient.invalidateQueries([
      'historical_action_statut',
      collectiviteId,
      actionId,
    ]);
  };

  // souscrit aux changements de la table de statuts
  const subscribe = () => {
    supabaseClient
      .from('action_statut')
      .on('INSERT', refetch)
      .on('UPDATE', refetch)
      .subscribe();
  };

  useEffect(() => subscribe(), []);
  const {data} = useQuery<IHistoricalActionStatutRead[] | null>(
    ['historical_action_statut', collectiviteId, actionId],
    () => fetchHistoricalActionStatutList(collectiviteId, actionId)
  );
  return data || [];
};
