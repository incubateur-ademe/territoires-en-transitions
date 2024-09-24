import { modulesFetch } from '@tet/api/plan-actions/dashboards/collectivite-dashboard';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

/** Charge les différents modules du tableau de bord personnel */
export const useCollectiviteModulesFetch = () => {
  const collectiviteId = useCollectiviteId();

  return useQuery(getQueryKey(collectiviteId), async () => {
    if (!collectiviteId) {
      throw new Error('Aucune collectivité associée');
    }

    const { data, error } = await modulesFetch({
      dbClient: supabaseClient,
      collectiviteId,
    });

    if (error) {
      throw error;
    }

    return data;
  });
};

export const getQueryKey = (collectiviteId?: number | null) =>
  ['collectivite-dashboard-modules', collectiviteId] as const;
