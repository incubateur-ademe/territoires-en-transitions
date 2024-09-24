import { Indicateurs } from '@tet/api';
import { DISABLE_AUTO_REFETCH, supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import Fuse from 'fuse.js';
import { useQuery } from 'react-query';

/**
 * Charge la liste d'indicateurs en fonction du filtre donné
 *
 * @param filtre Paramètres de filtrage
 */
export const useFilteredIndicateurDefinitions = (
  options: Indicateurs.domain.FetchOptions,
  disableAutoRefresh?: boolean
) => {
  const collectivite_id = useCollectiviteId();

  // état par défaut pour supporter les anciens appels (infinite scroll)
  const disableRefresh = disableAutoRefresh ?? true;

  return useQuery(
    ['indicateur_definitions', collectivite_id, options],
    async () => {
      if (!collectivite_id) return [];

      //A search which starts by # is an identifier search done on backend side
      const textSearch =
        options.filtre?.text && !options.filtre?.text.startsWith('#')
          ? options.filtre?.text
          : null;
      if (textSearch) {
        delete options.filtre?.text; // Delete it, search is done locally for now due to backend reasons
      }
      const { data, error } = await Indicateurs.fetchFilteredIndicateurs(
        supabaseClient,
        collectivite_id,
        options
      );

      if (error) {
        throw new Error(error.message);
      }

      if (textSearch) {
        const fuse = new Fuse(data, {
          keys: ['titre'],
          threshold: 0.3,
          shouldSort: false,
        });
        return fuse.search(textSearch).map((r) => r.item);
      } else {
        return data;
      }
    },
    disableRefresh ? DISABLE_AUTO_REFETCH : {}
  );
};
