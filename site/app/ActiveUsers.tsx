'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import * as Plot from '@observablehq/plot';
import { supabase } from './initSupabase';

function useActiveUsers() {
  return useSWR('stats_unique_active_users', () =>
    supabase.from('stats_unique_active_users').select()
  );
}

export default function ActiveUsers() {
  const { data } = useActiveUsers();
  const ref = useRef();

  useEffect(() => {
    if (data === undefined) return;
    const chart = Plot.plot({
      style: {
        background: 'transparent',
      },
      y: {
        grid: true,
      },
      color: {
        type: 'diverging',
        scheme: 'burd',
      },
      marks: [
        Plot.ruleY([0]),
        Plot.dot(data, { x: 'Date', y: 'Anomaly', stroke: 'Anomaly' }),
      ],
    });
    if (ref.current) {
      ref.current.append(chart);
    }
    return () => chart.remove();
  }, [data]);

  return <div ref={ref} />;
}
