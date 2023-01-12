'use client';

import useSWR from 'swr';
import { ResponsivePie } from '@nivo/pie';
import { supabase } from '../initSupabase';
import { bottomLegend, colors, theme } from './shared';

export function useTrancheCompletude() {
  return useSWR('stats_tranche_completude', async () => {
    const { data, error } = await supabase
      .from('stats_tranche_completude')
      .select()
      .gt('lower_bound', 0)
      .order('lower_bound', { ascending: false });
    if (error) {
      throw new Error('stats_tranche_completude');
    }
    if (!data) {
      return null;
    }
    return {
      tranches: data.map((d) => {
        return {
          id: d.lower_bound,
          label:
            d.lower_bound + `${d.upper_bound ? '-' + d.upper_bound : ''}` + '%',
          eci: d.eci,
          cae: d.cae,
        };
      }),
      inities: getSum(data),
      termines: getSum(data.filter((d) => d.lower_bound === 100)),
      presqueTermines: getSum(data.filter((d) => d.lower_bound >= 80)),
    };
  });
}

// somme des compteurs par référentiel pour calculer les décomptes
// initiés/terminés/remplis à 80% et plus
const getSum = (data: Array<{ cae: number; eci: number }>) =>
  data.reduce((cnt, d) => cnt + d.cae + d.eci, 0);

type Props = { referentiel: 'eci' | 'cae' };

export default function TrancheCompletude(props: Props) {
  const { data } = useTrancheCompletude();

  if (!data) {
    return null;
  }

  return (
    <div style={{ height: 300 }}>
      <ResponsivePie
        colors={['#21AB8E', '#34BAB5', '#FFCA00', '#FFB7AE', '#FF732C']}
        theme={theme}
        data={data.tranches}
        value={props.referentiel}
        margin={{ top: 40, right: 85, bottom: 25, left: 85 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        arcLinkLabel="label"
        arcLinkLabelsDiagonalLength={10}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        tooltip={() => null}
      />
    </div>
  );
}
