'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import * as Plot from '@observablehq/plot';
import { supabase } from './initSupabase';

function useActiveUsers() {
  return useSWR('stats_unique_active_users', async () => {
    const { data, error } = await supabase
      .from('stats_unique_active_users')
      .select();
    if (error) {
      throw new Error('stats_unique_active_users');
    }
    return data?.map((d) => ({ ...d, date: new Date(d.date) })) || [];
  });
}

export default function ActiveUsers() {
  const { data } = useActiveUsers();
  const ref = useRef();

  useEffect(() => {
    if (data === undefined) return;

    const chart = Plot.plot({
      y: { label: "Nombre d'utilisateurs actifs", grid: true },
      marks: [
        Plot.line(data, {
          x: 'date',
          y: 'count',
          stroke: '#4e79a7',
          marker: 'circle',
        }),
        Plot.line(data, {
          x: 'date',
          y: 'cumulated_count',
          stroke: '#e15759',
          marker: 'circle',
        }),
      ],
    });
    if (ref.current) {
      ref.current.append(chart);
    }
    return () => chart.remove();
  }, [data]);

  return <div ref={ref} />;
}
