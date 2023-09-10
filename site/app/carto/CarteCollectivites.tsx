'use server';

import dynamic from 'next/dynamic';
import {supabase} from '../initSupabase';
import {Database, Json} from '../database.types';
import {CollectiviteFeature} from "./CollectiviteFeature";

type labellisation_w_geojson =
  Database['public']['Views']['site_labellisation']['Row'] & { geojson?: Json };

type Props = {
  type: 'labellisees' | 'labellisees_eci' | 'labellisees_cae' | 'cot';
};

export default async function CarteCollectivites(props: Props) {

  // Import du composant uniquement client side.
  const CarteNoSSR = dynamic(() => import('./Carte'), {
    ssr: false,
  });

  // todo utiliser le type pour modifier le select.
  const {type} = props;

  const {data, error} = await supabase
    .from('site_labellisation')
    .select('*, geojson')
    .eq('labellise', true);

  if (!data) {
    return null;
  }

  const results = data as unknown as labellisation_w_geojson[];

  return <CarteNoSSR>
    {results.filter(c => !!c.geojson).map((c) =>
      <CollectiviteFeature item={c} key={c.collectivite_id}/>
    )}
  </CarteNoSSR>;
}
