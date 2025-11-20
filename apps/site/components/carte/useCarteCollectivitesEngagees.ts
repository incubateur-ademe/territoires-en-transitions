import { Json, Views } from '@tet/api';
import { supabase } from '@/site/app/initSupabase';
import useSWR from 'swr';

export type labellisation_w_geojson = Views<'site_labellisation'> & {
  geojson?: Json;
};

type region_w_geojson = Views<'site_region'> & {
  geojson?: Json;
};

export type CollectivitesCarteFrance = {
  collectivites: labellisation_w_geojson[];
  regions: region_w_geojson[];
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

    // Appel en deux temps pour éviter un timeout
    const { error: collectivitesActivesError, data: collectivitesActivesData } =
      await supabase
        .from('site_labellisation')
        .select('*, geojson')
        .eq('engagee', false)
        .eq('active', true);

    if (collectivitesActivesError) {
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
      collectivites: [
        ...(collectivitesData as unknown as labellisation_w_geojson[]),
        ...(collectivitesActivesData as unknown as labellisation_w_geojson[]),
      ],
      regions: regionsData as unknown as region_w_geojson[],
    };
  });
};
