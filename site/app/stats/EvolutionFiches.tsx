'use client';

import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { ResponsiveLine } from '@nivo/line';
import { colors } from './shared';

type Vue =
  | 'stats_evolution_nombre_fiches'
  | 'stats_evolution_collectivite_avec_minimum_fiches';

const colonneValeur = {
  stats_evolution_nombre_fiches: 'fiches',
  stats_evolution_collectivite_avec_minimum_fiches: 'collectivites',
};

const legende = {
  stats_evolution_nombre_fiches: 'Nombre total de fiches',
  stats_evolution_collectivite_avec_minimum_fiches:
    'Collectivités avec cinq fiches ou plus',
};

const labels = {
  fiches: 'Fiches',
  collectivites: 'Collectivités',
};

function useEvolutionFiches(vue: Vue) {
  return useSWR(vue, async () => {
    const { data, error } = await supabase
      .from(vue)
      .select()
      .gte('mois', '2022-01-01');
    if (error) {
      throw new Error(vue);
    }
    if (!data) {
      return [];
    }
    return {
      evolution: [
        {
          id: colonneValeur[vue],
          data: data.map((d) => ({ x: d.mois, y: d[colonneValeur[vue]] })),
        },
      ],
    };
  });
}

type Props = { vue: Vue };

export default function EvolutionFiches(props: Props) {
  const { vue } = props;
  const { data } = useEvolutionFiches(vue);

  if (!data) {
    return null;
  }

  return (
    <div style={{ height: 100 + '%' }}>
      <ResponsiveLine
        colors={colors}
        data={data.evolution}
        // les marges servent aux légendes
        margin={{ top: 5, right: 5, bottom: 50, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
        }}
        // on interpole la ligne de façon bien passer sur les points
        curve="monotoneX"
        lineWidth={4}
        enablePoints={false}
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
          legend: legende[vue],
          legendOffset: -35,
          legendPosition: 'middle',
        }}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={4}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableSlices="x"
        sliceTooltip={({ slice }) => {
          return (
            <div
              style={{
                background: 'white',
                padding: '9px 12px',
                border: '1px solid #ccc',
              }}
            >
              {slice.points.map((point) => (
                <div key={point.id}>
                  {labels[point.serieId]}: {point.data.yFormatted}
                </div>
              ))}
            </div>
          );
        }}
      />
    </div>
  );
}
