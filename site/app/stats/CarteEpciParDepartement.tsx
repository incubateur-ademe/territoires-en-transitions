'use client';

import useSWR from 'swr';
import {ResponsiveChoropleth} from '@nivo/geo';
import {supabase} from '../initSupabase';
import {bottomLegend, theme} from './shared';

function useCarteEpciParDepartement() {
  return useSWR('stats_carte_epci_par_departement', async () => {
    const {data, error} = await supabase
      .from('stats_carte_epci_par_departement')
      .select();
    if (error) {
      throw new Error('stats_carte_epci_par_departement');
    }
    if (!data || !data.length) {
      return null;
    }
    const actives_max = Math.max(...data.map(d => d.actives || 0));
    const total_max = Math.max(...data.map(d => d.total || 0));
    return {
      actives_max: actives_max,
      total_max: total_max,
      ratio_max: actives_max / total_max,
      valeurs: data.map(d => {
        return {
          id: d.insee,
          total: d.total,
          actives: d.actives,
          ratio: (d.actives || 0) / (d.total || 1),
        };
      }),
      geojson: {
        type: 'FeatureCollection',
        features: data.map(d => {
          return {
            id: d.insee,
            ...(d.geojson as object),
          };
        }),
      },
    };
  });
}

type Props = {
  valeur: 'actives' | 'ratio';
  maximum: 'actives_max' | 'total_max' | 'ratio_max';
};

export default function CarteEpciParDepartement(props: Props) {
  const {data} = useCarteEpciParDepartement();
  const {valeur, maximum} = props;

  if (!data) {
    return null;
  }

  // la taille est absolue, car Nivo ne peut pas centrer la carte un point
  // et les offsets sont relatifs à la taille.
  return (
    <div style={{height: 400}}>
      <ResponsiveChoropleth
        colors="nivo"
        theme={theme}
        data={data.valeurs}
        features={data.geojson.features}
        margin={{top: 0, right: 0, bottom: 60, left: 0}}
        domain={[0, data[maximum]]}
        unknownColor="#666666"
        label="properties.libelle"
        value={valeur}
        valueFormat={'>-.0' + (valeur === 'ratio' ? '%' : 'f')}
        projectionScale={1300}
        projectionTranslation={[0.35, 3.5]}
        projectionRotation={[0, 0, 0]}
        enableGraticule={false}
        graticuleLineColor="#dddddd"
        borderWidth={0.5}
        borderColor="#152538"
        legends={[bottomLegend]}
      />
    </div>
  );
}
