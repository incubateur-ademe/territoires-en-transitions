import {moduleFetch} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/module.fetch';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export const useModuleFetch = (slug: string) => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;

  return useQuery(
    ['tableau_de_bord_module', collectiviteId, userId, slug],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      if (!userId) {
        throw new Error('Aucun utilisateur connecté');
      }

      const {data, error} = await moduleFetch({
        dbClient: supabaseClient,
        collectiviteId,
        userId,
        slug,
      });

      if (error) {
        throw error;
      }

      return data;
    }
  );
};
