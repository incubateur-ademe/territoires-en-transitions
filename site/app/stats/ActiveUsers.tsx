'use client';

import useSWR from 'swr';
import { ResponsiveLine } from '@nivo/line';
import { supabase } from '../initSupabase';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  bottomLegend,
  colors,
  fromMonth,
  getLabelsById,
  getLegendData,
  theme,
} from './shared';
import { SliceTooltip } from './SliceTooltip';

function useActiveUsers() {
  return useSWR('stats_evolution_utilisateur', async () => {
    const { data, error } = await supabase
      .from('stats_evolution_utilisateur')
      .select()
      .gte('mois', fromMonth);
    if (error) {
      throw new Error('stats_evolution_utilisateur');
    }
    if (!data) {
      return null;
    }
    return {
      precedent: data[data.length - 2],
      courant: data[data.length - 1],
      evolution: [
        {
          id: 'utilisateurs',
          label: 'Nouveaux utilisateurs',
          data: data.map((d) => ({ x: d.mois, y: d.utilisateurs })),
        },
        {
          id: 'total_utilisateurs',
          label: 'Total utilisateurs',
          data: data.map((d) => ({ x: d.mois, y: d.total_utilisateurs })),
        },
      ],
    };
  });
}

export default function ActiveUsers() {
  const { data } = useActiveUsers();

  if (!data) {
    return null;
  }

  const { precedent, courant, evolution } = data;
  const legendData = getLegendData(evolution);
  const labelById = getLabelsById(evolution);

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--center">
        <h6>
          Notre plateforme est utilisée par&nbsp;
          {courant?.total_utilisateurs} personnes, dont&nbsp;
          {precedent?.utilisateurs} nous ont rejoint le mois dernier
        </h6>
      </div>
      <div style={{ height: 400 }}>
        <ResponsiveLine
          theme={theme}
          colors={colors}
          data={evolution}
          // les marges servent aux légendes
          margin={{ top: 5, right: 5, bottom: 85, left: 50 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 0,
            max: 'auto',
            stacked: false,
          }}
          // on interpole la ligne de façon bien passer sur les points
          curve="monotoneX"
          lineWidth={4}
          pointSize={4}
          yFormat=" >-.0f"
          axisBottom={axisBottomAsDate}
          axisLeft={axisLeftMiddleLabel("Nombre d'utilisateurs actifs")}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={4}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          enableSlices="x"
          sliceTooltip={(props) => (
            <SliceTooltip {...props} labels={labelById} />
          )}
          legends={[
            {
              ...bottomLegend,
              data: legendData,
              translateY: 85,
              itemWidth: 180,
            },
          ]}
        />
      </div>
    </div>
  );
}
