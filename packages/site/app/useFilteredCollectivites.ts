import { makeSearchString } from '@tet/api';
import { supabase } from '@tet/site/app/initSupabase';
import useSWR from 'swr';

export const useFilteredCollectivites = (search: string) => {
  return useSWR(`site_labellisation-filtered-${search}`, async () => {
    const query = supabase
      .from('site_labellisation')
      .select()
      .order('nom')
      .limit(10);

    const processedSearch = makeSearchString(search, 'nom');
    if (processedSearch) {
      query.or(processedSearch);
    }

    const { error, data } = await query;

    if (error) {
      throw new Error(`site_labellisation-filtered-${search}`);
    }
    if (!data || !data.length) {
      return null;
    }

    return { filteredCollectivites: data || [] };
  });
};
