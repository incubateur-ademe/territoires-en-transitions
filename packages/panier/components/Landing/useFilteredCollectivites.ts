import { makeSearchString } from '@tet/api';
import useSWR from 'swr';
import { supabase } from '../../src/clientAPI';

type Collectivite = {
  collectivite_id: number;
  nom: string;
  departement_code?: number;
  engagee?: boolean;
};

/** Donne la liste des collectivités dont le nom inclus la chaîne recherchée */
export const useFilteredCollectivites = (search: string, limit = 10) => {
  const key = `site_labellisation-filtered-${search}`;
  return useSWR(key, async () => {
    const query = supabase
      .from('site_labellisation')
      .select('collectivite_id, nom, departement_code, engagee')
      .order('nom');

    const processedSearch = makeSearchString(search, 'nom');
    if (processedSearch) {
      query.or(processedSearch);
    }

    query.limit(limit);

    const { error, data } = await query.returns<Collectivite[]>();

    if (error) {
      throw new Error(key);
    }
    if (!data || !data.length) {
      return null;
    }

    return data || [];
  });
};
