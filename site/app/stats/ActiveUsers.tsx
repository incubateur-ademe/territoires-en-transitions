'use client';

import useSWR from 'swr';
import { ResponsiveLine } from '@nivo/line';
import { supabase } from '../initSupabase';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  bottomLegend,
  colors,
  dateAsMonthAndYear,
  fromMonth,
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
      courant: data[data.length - 2],
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

  const { courant, evolution } = data;
  const legendData = evolution.map(({ id, label }, index) => ({
    id,
    label,
    color: colors[index],
  }));
  const labelById = evolution.reduce(
    (byId, { id, label }) => ({ ...byId, [id]: label }),
    {}
  );

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--center">
        <h6>
          {courant?.total_utilisateurs} utilisateurs dont{' '}
          {courant?.utilisateurs} nouveaux utilisateurs le mois dernier
        </h6>
      </div>
      <div style={{ height: 450 }}>
        <ResponsiveLine
          colors={colors}
          data={evolution}
          // les marges servent aux légendes
          margin={{ top: 5, right: 5, bottom: 85, left: 50 }}
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
          axisTop={null}
          axisRight={null}
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
          legends={[{ ...bottomLegend, translateY: 75, data: legendData }]}
        />
      </div>
    </div>
  );
}
