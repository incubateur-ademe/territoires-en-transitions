import {supabaseClient} from 'core-logic/api/supabase';
import {useEffect} from 'react';
import {useQuery, useQueryClient} from 'react-query';

export type Maintenance = {
  now: string;
  begins_at: string;
  ends_at: string;
};

// Télécharge la dernière maintenance en cours
const fetchMaintenance = async (): Promise<Maintenance | null> => {
  const query = supabaseClient
    .from<Maintenance>('ongoing_maintenance')
    .select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data && data.length ? data[0] : null;
};

// Donne les horaires de la dernière maintenance en cours (null si aucune maitenance en cours)
export const useMaintenance = (): Maintenance | null => {
  const queryClient = useQueryClient();

  // recharge les données lors de la mise à jour de la table de maintenance
  const refetch = () => {
    console.log('invalidate view, hence re-fetch');
    queryClient.invalidateQueries(['ongoing_maintenance']);
  };

  // souscrit aux changements de la table de maintenance
  const subscribe = () =>
    supabaseClient
      .from('maintenance')
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

  const {data} = useQuery<Maintenance | null>(
    ['ongoing_maintenance'],
    fetchMaintenance
  );
  return data || null;
};
