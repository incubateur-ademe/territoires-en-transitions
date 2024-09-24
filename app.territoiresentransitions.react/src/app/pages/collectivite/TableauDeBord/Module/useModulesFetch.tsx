import { modulesFetch } from '@tet/api/plan-actions/dashboards/personal-dashboard';
import { useAuth } from 'core-logic/api/auth/AuthProvider';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

/** Charges les différents modules du tableau de bord personnel */
export const useModulesFetch = () => {
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
  ['collectivite_tableau_de_bord_modules', collectiviteId, userId] as const;
