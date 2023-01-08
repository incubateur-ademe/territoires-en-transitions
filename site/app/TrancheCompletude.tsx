'use client';

import useSWR from 'swr';
import {supabase} from './initSupabase';
import {ResponsivePie} from '@nivo/pie';

function useTrancheCompletude() {
  return useSWR('stats_tranche_completude', async () => {
    const {data, error} = await supabase.from('stats_tranche_completude').
      select().
      gt('lower_bound', 0);
    if (error) {
      throw new Error('stats_tranche_completude');
    }
    if (!data) {
      return [];
    }
    return data.map(d => {
      return {
        'id': d.lower_bound,
        'label': d.lower_bound + `${d.upper_bound ? '-' + d.upper_bound : ''}` +
          '%',
        'eci': d.eci,
        'cae': d.cae,
      };
    });
  });
}

type Props = { referentiel: 'eci' | 'cae' };

export default function TrancheCompletude(props: Props) {
  const {data} = useTrancheCompletude();

  if (!data) {
    return null;
  }

  return <div style={{height: 450}}>
    <ResponsivePie
      data={data}
      value={props.referentiel}
      margin={{top: 40, right: 80, bottom: 80, left: 80}}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderWidth={1}
      borderColor={{
        from: 'color',
        modifiers: [
          [
            'darker',
            0.2,
          ],
        ],
      }}
      arcLinkLabel="label"
      arcLinkLabelsDiagonalLength={0}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#333333"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{from: 'color'}}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={{
        from: 'color',
        modifiers: [
          [
            'darker',
            2,
          ],
        ],
      }}
      legends={[
        {
          anchor: 'bottom',
          direction: 'row',
          justify: false,
          translateX: 0,
          translateY: 56,
          itemsSpacing: 0,
          itemWidth: 100,
          itemHeight: 18,
          itemTextColor: '#999',
          itemDirection: 'left-to-right',
          itemOpacity: 1,
          symbolSize: 18,
          symbolShape: 'circle',
          effects: [
            {
              on: 'hover',
              style: {
                itemTextColor: '#000',
              },
            },
          ],
        },
      ]}
    />
  </div>;
}
