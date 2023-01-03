'use client';

import useSWR from 'swr';
import { supabase } from './initSupabase';
import { ResponsiveLine } from '@nivo/line';

function useActiveUsers() {
  return useSWR('stats_unique_active_users', async () => {
    const { data, error } = await supabase
      .from('stats_unique_active_users')
      .select();
    if (error) {
      throw new Error('stats_unique_active_users');
    }
    if (!data) {
      return [];
    }
    return [
      {
        id: 'count',
        data: data.map((d) => ({ x: d.date, y: d.count })),
      },
      {
        id: 'cumulated_count',
        data: data.map((d) => ({ x: d.date, y: d.cumulated_count })),
      },
    ];
  });
}

export default function ActiveUsers() {
  const { data } = useActiveUsers();

  if (!data) {
    return null;
  }

  return (
    <div style={{ height: 400 }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 55, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        yFormat=" >-.2f"
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
        crosshairType="cross"
        useMesh={true}
      />
    </div>
  );
}
