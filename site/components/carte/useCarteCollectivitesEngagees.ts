import {Database, Json} from 'app/database.types';
import {supabase} from 'app/initSupabase';
import useSWR from 'swr';

type labellisation_w_geojson =
  Database['public']['Views']['site_labellisation']['Row'] & {geojson?: Json};

type region_w_geojson = Database['public']['Views']['site_region']['Row'] & {
  geojson?: Json;
};

export const useCarteCollectivitesEngagees = () => {
  return useSWR('site_labellisation-carte-engagees', async () => {
    const {error: collectivitesError, data: collectivitesData} = await supabase
      .from('site_labellisation')
      .select('*, geojson')
      .eq('engagee', true);

    if (collectivitesError) {
      throw new Error('site_labellisation-carte-engagees');
    }

    const {error: regionsError, data: regionsData} = await supabase
      .from('site_region')
      .select('*, geojson');

    if (regionsError) {
      throw new Error('site_labellisation-carte-engagees');
    }

    if (!collectivitesData || !regionsData) {
      return null;
    }

    return {
      collectivites: collectivitesData as unknown as labellisation_w_geojson[],
      regions: regionsData as unknown as region_w_geojson[],
    };
  });
};
