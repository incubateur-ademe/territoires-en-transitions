import {supabase} from 'app/initSupabase';
import useSWR from 'swr';

export const useFilteredCollectivites = (search: string) => {
  return useSWR(`site_labellisation-filtered-${search}`, async () => {
    const query = supabase
      .from('site_labellisation')
      .select()
      .order('nom')
      .limit(10);

    if (search) {
      const processedSearch = search
        .split(' ')
        .map(w => w.trim())
        .filter(w => w !== '')
        .join(' ');

      const processedSearchWithDash = processedSearch.split(' ').join('-');
      const processedSearchWithDashAndSpace = processedSearch
        .split(' ')
        .join(' - ');
      const processedSearchWithoutDash = processedSearch.split('-').join(' ');

      query.or(
        `"nom".ilike.%${processedSearch}%,"nom".ilike.%${processedSearchWithDash}%,"nom".ilike.%${processedSearchWithDashAndSpace}%,"nom".ilike.%${processedSearchWithoutDash}%`,
      );
    }

    const {error, data} = await query;

    if (error) {
      throw new Error(`site_labellisation-filtered-${search}`);
    }
    if (!data || !data.length) {
      return null;
    }

    return {filteredCollectivites: data || []};
  });
};

export const useCollectivite = (code_siren_insee: string) => {
  return useSWR(`site_labellisation-${code_siren_insee}`, async () => {
    const {data, error} = await supabase
      .from('site_labellisation')
      .select()
      .match({code_siren_insee});

    if (error) {
      throw new Error(`site_labellisation-${code_siren_insee}`);
    }
    if (!data || !data.length) {
      return null;
    }

    return data;
  });
};
