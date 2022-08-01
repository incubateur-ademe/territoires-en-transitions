import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Membre} from './types';

/**
 * Donne accès à la liste des membres de la collectivité courante
 */
export const useCollectiviteMembres = (): {
  membres: Membre[];
  isLoading: boolean;
} => {
  const collectiviteId = useCollectiviteId();

  const {data, isLoading} = useQuery(getQueryKey(collectiviteId), () =>
    collectiviteId ? fetchMembresForCollectivite(collectiviteId) : []
  );

  return {membres: data || [], isLoading};
};

export const getQueryKey = (collectivite_id: number | null) => [
  'collectivite_membres',
  collectivite_id,
];

const fetchMembresForCollectivite = async (
  collectiviteId: number
): Promise<Membre[]> => {
  const {data, error} = await supabaseClient
    .rpc('collectivite_membres', {
      id: collectiviteId,
    })
    .select();

  if (error) {
    return [];
  }
  return (data as unknown as Membre[]) || null;
};
