'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {ResponsiveLine} from '@nivo/line';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  colors,
  fromMonth,
  theme,
} from './shared';

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

export function useEvolutionFiches(vue: Vue) {
  return useSWR(vue, async () => {
    const {data, error} = await supabase
      .from(vue)
      .select()
      .gte('mois', fromMonth);
    if (error) {
      throw new Error(vue);
    }
    if (!data) {
      return null;
    }
    return {
      evolution: [
        {
          id: labels[colonneValeur[vue] as keyof typeof labels],
          // @ts-ignore
          data: data.map(d => ({x: d.mois, y: d[colonneValeur[vue]]})),
        },
      ],
      // @ts-ignore
      last: data[data.length - 1][colonneValeur[vue]],
    };
  });
}

type Props = {vue: Vue};

export default function EvolutionFiches(props: Props) {
  const {vue} = props;
  const {data} = useEvolutionFiches(vue);

  if (!data) {
    return null;
  }

  return (
    <div style={{height: 100 + '%', maxHeight: 400 + 'px'}}>
      <ResponsiveLine
        colors={colors}
        theme={theme}
        data={data.evolution}
        // les marges servent aux légendes
        margin={{top: 5, right: 5, bottom: 55, left: 50}}
        xScale={{type: 'point'}}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
        }}
        // on interpole la ligne de façon bien passer sur les points
        curve="monotoneX"
        lineWidth={4}
        enablePoints={true}
        yFormat=" >-.0f"
        axisTop={null}
        axisRight={null}
        axisBottom={axisBottomAsDate}
        axisLeft={axisLeftMiddleLabel(legende[vue])}
        pointColor={{theme: 'background'}}
        pointBorderWidth={4}
        pointBorderColor={{from: 'serieColor'}}
        pointLabelYOffset={-12}
        enableSlices="x"
      />
    </div>
  );
}
