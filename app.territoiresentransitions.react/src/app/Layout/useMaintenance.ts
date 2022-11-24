import {supabaseClient} from 'core-logic/api/supabase';
import {useEffect} from 'react';
import {useQuery, useQueryClient} from 'react-query';

// Télécharge la dernière maintenance en cours
const fetchMaintenance = async () => {
  const query = supabaseClient.from('ongoing_maintenance').select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data && data.length ? data[0] : null;
};

// Donne les horaires de la dernière maintenance en cours (null si aucune maitenance en cours)
export const useMaintenance = () => {
  const queryClient = useQueryClient();

  // recharge les données lors de la mise à jour de la table de maintenance
  const refetch = () => {
    queryClient.invalidateQueries(['ongoing_maintenance']);
  };

  // souscrit aux changements de la table de maintenance
  const table = {schema: 'public', table: 'maintenance'};
  const subscribe = () =>
    supabaseClient
      .channel('public:maintenance')
      .on('postgres_changes', {event: 'INSERT', ...table}, refetch)
      .on('postgres_changes', {event: 'UPDATE', ...table}, refetch)
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

  const {data} = useQuery(['ongoing_maintenance'], fetchMaintenance);
  return data || null;
};

export type Maintenance = ReturnType<typeof useMaintenance>;
