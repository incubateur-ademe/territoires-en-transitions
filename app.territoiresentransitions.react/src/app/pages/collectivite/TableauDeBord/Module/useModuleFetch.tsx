import {moduleFetch} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/actions/module.fetch';
import {Slug} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {QueryKey, useQuery} from 'react-query';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité et d'un user.
 */
export const useModuleFetch = (slug: Slug) => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;

  return useQuery(getQueryKey(slug), async () => {
    if (!collectiviteId) {
      throw new Error('Aucune collectivité associée');
    }

    if (!userId) {
      throw new Error('Aucun utilisateur connecté');
    }

    return await moduleFetch({
      dbClient: supabaseClient,
      collectiviteId,
      userId,
      slug,
    });
  });
};

export const getQueryKey = (slug?: Slug): QueryKey => [
  'collectivite_tableau_de_bord_module_page',
  slug,
];
