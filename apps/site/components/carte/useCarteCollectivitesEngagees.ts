import { Json } from '@tet/api';
import { supabase } from '@/site/app/initSupabase';
import useSWR from 'swr';

/** Ligne de la vue `site_labellisation` */
type SiteLabellisation = {
  active: boolean | null;
  cae_etoiles: number | null;
  cae_obtenue_le: string | null;
  cae_score_programme: number | null;
  cae_score_realise: number | null;
  code_siren_insee: string | null;
  collectivite_id: number | null;
  cot: boolean | null;
  departement_code: string | null;
  departement_name: string | null;
  eci_etoiles: number | null;
  eci_obtenue_le: string | null;
  eci_score_programme: number | null;
  eci_score_realise: number | null;
  engagee: boolean | null;
  labellisee: boolean | null;
  nature_collectivite: string | null;
  nom: string | null;
  population_totale: number | null;
  region_code: string | null;
  region_name: string | null;
  type_collectivite: string | null;
};

/** Ligne de la vue `site_region` */
type SiteRegion = {
  insee: string | null;
  libelle: string | null;
};

export type labellisation_w_geojson = SiteLabellisation & {
  geojson?: Json;
};

export type region_w_geojson = SiteRegion & {
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
