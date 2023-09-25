import {supabase} from 'app/initSupabase';
import useSWR from 'swr';

export const useFilteredCollectivites = (search: string) => {
  return useSWR(`site_labellisation-filtered-${search}`, async () => {
    const name = `${search}:*`
      .split(' ')
      .map(w => w.trim())
      .join(' & ');

    const query = supabase
      .from('site_labellisation')
      .select()
      .order('nom')
      .limit(10);

    if (search) {
      query.textSearch('nom', name, {
        config: 'french',
      });
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
