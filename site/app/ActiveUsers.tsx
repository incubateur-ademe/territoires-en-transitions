'use client';

import useSWR from 'swr';
import { supabase } from './initSupabase';
import { ResponsiveLine } from '@nivo/line';

function useActiveUsers() {
  return useSWR('stats_evolution_utilisateur', async () => {
    const { data, error } = await supabase
      .from('stats_evolution_utilisateur')
      .select()
      .gte('mois', '2022-01-01');
    if (error) {
      throw new Error('stats_evolution_utilisateur');
    }
    if (!data) {
      return [];
    }
    return {
      'courant': data[data.length - 2],
      'evolution': [
      {
        id: 'utilisateurs',
        data: data.map((d) => ({ x: d.mois, y: d.utilisateurs })),
      },
      {
        id: 'total_utilisateurs',
        data: data.map((d) => ({ x: d.mois, y: d.total_utilisateurs })),
      },
    ]};
  });
}

const labels = {
  'total_utilisateurs': 'Total utilisateurs',
  'utilisateurs': 'Nouveaux utilisateurs',
};

export default function ActiveUsers() {
  const { data } = useActiveUsers();

  if (!data) {
    return null;
  }

  return <div>
    <div className="fr-grid-row fr-grid-row--center">
      <h3>{data.courant.total_utilisateurs} utilisateurs
        dont {data.courant.utilisateurs} nouveaux utilisateurs le mois dernier</h3>
    </div>
    <div style={{ height: 450 }}>
      <ResponsiveLine
        data={data.evolution}

        // les marges servent aux légendes
        margin={{top: 5, right: 5, bottom: 50, left: 50}}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
        }}

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
          legend: "Nombre d'utilisateurs actifs",
          legendOffset: -35,
          legendPosition: 'middle',
        }}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={3}
        pointBorderColor={{ from: 'serieColor' }}
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
              {slice.points.map(point => (
                <div
                  key={point.id}
                  style={{
                    color: point.serieColor,
                    padding: '3px 0',
                  }}
                >
                  {labels[point.serieId]}: {point.data.yFormatted}
                </div>
              ))}
            </div>
          );
        }}
      />
    </div>
  </div>;
}
