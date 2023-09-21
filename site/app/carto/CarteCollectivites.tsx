'use server';

import dynamic from 'next/dynamic';
import {supabase} from '../initSupabase';
import {Database, Json} from '../database.types';
import {CollectiviteFeature} from './CollectiviteFeature';
import {RegionFeature} from './RegionFeature';

type labellisation_w_geojson =
  Database['public']['Views']['site_labellisation']['Row'] & {geojson?: Json};

type region_w_geojson = Database['public']['Views']['site_region']['Row'] & {
  geojson?: Json;
};

type Props = {
  filtre: 'labellisees' | 'labellisees_eci' | 'labellisees_cae' | 'cot';
};

export default async function CarteCollectivites(props: Props) {
  // Import du composant uniquement client side.
  const CarteNoSSR = dynamic(() => import('./Carte'), {
    ssr: false,
  });

  const {filtre} = props;

  let query = supabase.from('site_labellisation').select('*, geojson');

  if (filtre === 'labellisees') query = query.eq('labellise', true);
  if (filtre === 'labellisees_cae') query = query.lte('cae_etoiles', 1);
  if (filtre === 'labellisees_eci') query = query.lte('eci_etoiles', 1);
  if (filtre === 'cot') query = query.eq('cot', true);

  const collectivitesQuery = await query;
  const regionsQuery = await supabase.from('site_region').select('*, geojson');

  if (!collectivitesQuery.data || !regionsQuery.data) {
    return null;
  }

  const collectivites =
    collectivitesQuery.data as unknown as labellisation_w_geojson[];
  const regions = regionsQuery.data as unknown as region_w_geojson[];

  return (
    <CarteNoSSR>
      {regions
        .filter(r => !!r.geojson)
        .map(r => (
          <RegionFeature item={r} key={r.insee} />
        ))}
      {collectivites
        .filter(c => !!c.geojson)
        .map(c => (
          <CollectiviteFeature item={c} key={c.collectivite_id} />
        ))}
    </CarteNoSSR>
  );
}
