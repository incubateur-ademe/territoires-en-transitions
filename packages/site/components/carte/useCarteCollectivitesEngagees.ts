import { Views, Json } from '@tet/api';
import { supabase } from '@tet/site/app/initSupabase';
import useSWR from 'swr';

export type labellisation_w_geojson = Views<'site_labellisation'> & {
  geojson?: Json;
};

export type region_w_geojson = Views<'site_region'> & {
  geojson?: Json;
};

export const useCarteCollectivitesEngagees = () => {
  return useSWR('site_labellisation-carte-engagees', async () => {
    const { error: collectivitesError, data: collectivitesData } =
      await supabase
        .from('site_labellisation')
        .select('*, geojson')
        .eq('engagee', true);

    if (collectivitesError) {
      throw new Error('site_labellisation-carte-engagees');
    }

    const { error: regionsError, data: regionsData } = await supabase
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
