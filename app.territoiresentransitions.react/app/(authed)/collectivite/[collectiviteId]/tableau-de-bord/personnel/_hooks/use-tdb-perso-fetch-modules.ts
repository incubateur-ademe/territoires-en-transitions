import { useCollectiviteId } from '@/api/collectivites';
import { modulesFetch } from '@/api/plan-actions/dashboards/personal-dashboard';
import { useUser } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';

/** Charges les différents modules du tableau de bord personnel */
export const useTdbPersoFetchModules = () => {
  const supabase = useSupabase();

  const { id: userId } = useUser();

  const collectiviteId = useCollectiviteId();

  return useQuery(getQueryKey(collectiviteId), async () => {
    if (!collectiviteId) {
      throw new Error('Aucune collectivité associée');
    }

    if (!userId) {
      throw new Error('Aucun utilisateur connecté');
    }

    const { data, error } = await modulesFetch({
      dbClient: supabase,
      collectiviteId,
      userId,
    });

    if (error) {
      throw error;
    }

    return data;
  });
};

export const getQueryKey = (collectiviteId?: number | null) =>
  ['personal-dashboard-modules', collectiviteId] as const;
