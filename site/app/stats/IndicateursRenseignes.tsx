'use client';

import useSWR from 'swr';
import { ResponsiveLine } from '@nivo/line';
import { supabase } from '../initSupabase';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  colors,
  fromMonth,
  theme,
} from './shared';

function useIndicateursRenseignes() {
  return useSWR('stats_evolution_indicateur_referentiel', async () => {
    const { data, error } = await supabase
      .from('stats_evolution_indicateur_referentiel')
      .select()
      .gte('mois', fromMonth);
    if (error) {
      throw new Error('stats_evolution_indicateur_referentiel');
    }
    if (!data) {
      return null;
    }
    return [
      {
        id: 'Indicateurs',
        data: data.map((d) => ({ x: d.mois, y: d.indicateurs })),
      },
    ];
  });
}

export default function IndicateursRenseignes() {
  const { data } = useIndicateursRenseignes();

  if (!data) {
    return null;
  }

  return (
    <div>
      <div style={{ height: 450 }}>
        <ResponsiveLine
          colors={colors}
          theme={theme}
          data={data}
          // les marges servent aux légendes
          margin={{ top: 5, right: 5, bottom: 85, left: 55 }}
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
          pointSize={4}
          yFormat=" >-.0f"
          axisBottom={axisBottomAsDate}
          axisLeft={{
            ...axisLeftMiddleLabel(
              'Nombre d’indicateurs des référentiels renseignés'
            ),
            legendOffset: -50,
          }}
          pointBorderWidth={4}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          enableSlices="x"
        />
      </div>
    </div>
  );
}
