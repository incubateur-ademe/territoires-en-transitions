import { moduleFetch } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/data-access/module.fetch';
import { Slug } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { QueryKey, useQuery } from 'react-query';

/**
 * Fetch un module spécifique du tableau de bord d'une collectivité.
 */
export const useCollectiviteModuleFetch = (slug: Slug) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(getQueryKey(slug), async () => {
    if (!collectiviteId) {
      throw new Error('Aucune collectivité associée');
    }

    return await moduleFetch({
      dbClient: supabaseClient,
      collectiviteId,
      slug,
    });
  });
};

export const getQueryKey = (slug?: Slug): QueryKey => [
  'collectivite-dashboard-module',
  slug,
];
