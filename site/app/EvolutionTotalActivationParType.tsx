'use client';

import useSWR from 'swr';
import {supabase} from './initSupabase';
import {ResponsiveLine} from '@nivo/line';

function useEvolutionTotalActivationParType() {
  return useSWR('stats_evolution_total_activation_par_type', async () => {
    const {data, error} = await supabase.from(
      'stats_evolution_total_activation_par_type').
      select().
      gte('mois', '2022-01-01');
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return [];
    }
    return {
      'courant': data[data.length - 1],
      'evolution':
        [
          {
            id: 'total_epci',
            data: data.map((d) => ({x: d.mois, y: d.total_epci})),
          },
          {
            id: 'total_syndicat',
            data: data.map((d) => ({x: d.mois, y: d.total_syndicat})),
          },
          {
            id: 'total_commune',
            data: data.map((d) => ({x: d.mois, y: d.total_commune})),
          },
        ],
    };
  });
}

const labels = {
  'total_epci': 'EPCIs',
  'total_syndicat': 'syndicats',
  'total_commune': 'communes',
};

export default function EvolutionTotalActivationParType() {
  const {data} = useEvolutionTotalActivationParType();

  if (!data) {
    return null;
  }

  return <div>
    <div className="fr-grid-row fr-grid-row--center">
      <h3>{data.courant.total} collectivités activées
        dont {data.courant.total_epci} EPCIs,&nbsp;
        {data.courant.total_syndicat} syndicats et&nbsp;
        {data.courant.total_commune} communes</h3>
    </div>

    <div style={{height: 450}}>
      <ResponsiveLine
        data={data['evolution']}

        // les marges servent aux légendes
        margin={{top: 5, right: 5, bottom: 50, left: 50}}
        xScale={{type: 'point'}}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          // on empile les lignes pour représenter le total
          stacked: true,
        }}

        // les surfaces sous les lignes sont pleines
        enableArea={true}
        areaOpacity={1}

        // on interpole la ligne de façon bien passer sur les points
        curve="monotoneX"

        yFormat=" >-.0f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          legendPosition: 'end',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -35,
          format: (v) =>
            new Date(v).toLocaleDateString('fr', {
              month: 'short',
              year: 'numeric',
            }),
        }}
        axisLeft={{
          tickSize: 4,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Évolution des collectivités activées',
          legendOffset: -35,
          legendPosition: 'middle',
        }}
        pointColor={{theme: 'background'}}
        pointBorderWidth={3}
        pointBorderColor={{from: 'serieColor'}}
        pointLabelYOffset={-12}


        enableSlices="x"
        sliceTooltip={({slice}) => {
          return (
            <div
              style={{
                background: 'white',
                padding: '9px 12px',
                border: '1px solid #ccc',
              }}
            >
              <div>Collectivités :
                <strong>{slice.points.map(p => p.data.y).
                  reduce((a, b) => a + b)}</strong>
              </div>
              {slice.points.map(point => (
                <div
                  key={point.id}
                  style={{
                    color: point.serieColor,
                    padding: '3px 0',
                  }}
                >
                  dont {labels[point.serieId]} {point.data.yFormatted}
                </div>
              ))}
            </div>
          );
        }}
      />
    </div>
  </div>;
}
