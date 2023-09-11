'use server';

import dynamic from 'next/dynamic';
import {supabase} from '../initSupabase';
import {Database, Json} from '../database.types';
import {CollectiviteFeature} from './CollectiviteFeature';

type labellisation_w_geojson =
  Database['public']['Views']['site_labellisation']['Row'] & {geojson?: Json};

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

  const {data, error} = await query;

  if (!data) {
    return null;
  }

  const results = data as unknown as labellisation_w_geojson[];

  return (
    <CarteNoSSR>
      {results
        .filter(c => !!c.geojson)
        .map(c => (
          <CollectiviteFeature item={c} key={c.collectivite_id} />
        ))}
    </CarteNoSSR>
  );
}
