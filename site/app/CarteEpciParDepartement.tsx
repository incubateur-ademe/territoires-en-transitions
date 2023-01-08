'use client';

import useSWR from 'swr';
import {supabase} from './initSupabase';
import {ResponsiveChoropleth} from '@nivo/geo';

function useCarteEpciParDepartement() {
  return useSWR('stats_carte_epci_par_departement', async () => {
    const {data, error} = await supabase.from(
      'stats_carte_epci_par_departement').select();
    if (error) {
      throw new Error('stats_carte_epci_par_departement');
    }
    if (!data) {
      return [];
    }
    const actives_max = data.map(d => d.actives).
      reduce((a, b) => Math.max(a, b));
    const total_max = data.map(d => d.total).reduce((a, b) => Math.max(a, b));
    return {
      'actives_max': actives_max,
      'total_max': total_max,
      'ratio_max': actives_max / total_max * 100,
      'valeurs': data.map((d) => {
        return {
          'id': d.insee,
          'total': d.total,
          'actives': d.actives,
          'ratio': d.actives / d.total * 100,
        };
      }),
      'geojson': {
        'type': 'FeatureCollection',
        'features': data.map(d => {
          return {
            'id': d.insee,
            ...d.geojson,
          };
        }),
      },
    };
  });
}

type Props = {
  'valeur': 'actives' | 'ratio',
  'maximum': 'actives_max' | 'total_max' | 'ratio_max'
}

export default function CarteEpciParDepartement(props: Props) {
  const {data} = useCarteEpciParDepartement();
  const {valeur, maximum} = props;

  if (!data) {
    return null;
  }

  // la taille est absolue, car Nivo ne peut pas centrer la carte un point
  // et les offsets sont relatifs à la taille.
  return <div style={{height: 400 + 'px', width: 400 + 'px'}}>
    <ResponsiveChoropleth
      data={data.valeurs}
      features={data.geojson.features}
      margin={{top: 0, right: 0, bottom: 0, left: 0}}
      colors="nivo"
      domain={[0, data[maximum]]}
      unknownColor="#666666"
      label="properties.libelle"
      value={valeur}
      valueFormat=">-.0f"
      projectionScale={1300}
      projectionTranslation={[0.35, 3.5]}
      projectionRotation={[0, 0, 0]}
      enableGraticule={false}
      graticuleLineColor="#dddddd"
      borderWidth={0.5}
      borderColor="#152538"

      legends={[
        {
          anchor: 'bottom-left',
          direction: 'column',
          justify: true,
          translateX: 0,
          translateY: -100,
          itemsSpacing: 0,
          itemWidth: 80,
          itemHeight: 18,
          itemDirection: 'left-to-right',
          itemTextColor: '#444444',
          itemOpacity: 0.85,
          symbolSize: 18,
          effects: [
            {
              on: 'hover',
              style: {
                itemTextColor: '#000000',
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  </div>;
}
