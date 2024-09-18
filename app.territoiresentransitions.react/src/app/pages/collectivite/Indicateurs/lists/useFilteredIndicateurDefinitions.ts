import { Indicateurs } from '@tet/api';
import { FetchOptions } from '@tet/api/indicateurs/domain';
import { DISABLE_AUTO_REFETCH, supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

/**
 * Charge la liste d'indicateurs en fonction du filtre donné
 *
 * @param filtre Paramètres de filtrage
 */
export const useFilteredIndicateurDefinitions = (
  options: FetchOptions,
  disableAutoRefresh?: boolean
) => {
  const collectivite_id = useCollectiviteId();

  // état par défaut pour supporter les anciens appels (infinite scroll)
  const disableRefresh = disableAutoRefresh ?? true;

  return useQuery(
    ['indicateur_definitions', collectivite_id, options],
    async () => {
      if (!collectivite_id) return [];
      const { data, error } = await Indicateurs.fetchFilteredIndicateurs(
        supabaseClient,
        collectivite_id,
        options
      );

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    disableRefresh ? DISABLE_AUTO_REFETCH : {}
  );
};
