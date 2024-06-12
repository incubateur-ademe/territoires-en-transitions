import {modulesFetch} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/modules.fetch';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';

/**
 * Charge la liste d'indicateurs en fonction du filtre donné
 *
 * @param filter Paramètres de filtrage
 */
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

    const {data, error} = await modulesFetch({
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
