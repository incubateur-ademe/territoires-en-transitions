import {makeSearchString} from '@tet/api';
import {supabase} from 'src/clientAPI';
import useSWR from 'swr';

/** Donne la liste des collectivités dont le nom inclus la chaîne recherchée */
export const useFilteredCollectivites = (search: string, limit = 10) => {
  const key = `site_labellisation-filtered-${search}`;
  return useSWR(key, async () => {
    const query = supabase
      .from('site_labellisation')
      .select('collectivite_id, nom, departement_code, engagee')
      .order('nom')
      .limit(limit);

    const processedSearch = makeSearchString(search, 'nom');
    if (processedSearch) {
      query.or(processedSearch);
    }

    const {error, data} = await query;

    if (error) {
      throw new Error(key);
    }
    if (!data || !data.length) {
      return null;
    }

    return data || [];
  });
};
