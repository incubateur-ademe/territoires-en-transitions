import { modulesFetch } from '@/api/plan-actions/dashboards/personal-dashboard';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useAuth } from '@/app/users/auth-provider';
import { useQuery } from 'react-query';

/** Charges les différents modules du tableau de bord personnel */
export const usePersonalModulesFetch = () => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;

  return useQuery(getQueryKey(collectiviteId, userId), async () => {
    if (!collectiviteId) {
      throw new Error('Aucune collectivité associée');
    }

    if (!userId) {
      throw new Error('Aucun utilisateur connecté');
    }

    const { data, error } = await modulesFetch({
      dbClient: supabaseClient,
      collectiviteId,
      userId: userId,
    });

    if (error) {
      throw error;
    }

    return data;
  });
};

export const getQueryKey = (collectiviteId?: number | null, userId?: string) =>
  ['personal-dashboard-modules', collectiviteId, userId] as const;
