'use client';

import useSWR from 'swr';
import { ResponsivePie } from '@nivo/pie';
import { supabase } from '../initSupabase';
import { bottomLegend, colors, theme } from './shared';

function useCollectivitesLabellisees() {
  /*
  return useSWR('stats_collectivites_labellisees', async () => {
    const { data, error } = await supabase
      .from('stats_engagement_collectivite')
      .select()
      .or('etoiles_cae.gte.1, etoiles_eci.gte.1')
      .
    if (error) {
      throw new Error('stats_collectivites_labellisees');
    }
    if (!data) {
      return null;
    }
    return data.map((d) => {
      return {
        id: d.lower_bound,
        label:
          d.lower_bound + `${d.upper_bound ? '-' + d.upper_bound : ''}` + '%',
        eci: d.eci,
        cae: d.cae,
      };
    });
  });*/
  return { data: null };
}

type Props = { referentiel: 'eci' | 'cae' };

export default function CollectivitesLabellisees(props: Props) {
  const { data } = useCollectivitesLabellisees();

  if (!data) {
    return null;
  }

  return (
    <div style={{ height: 450 }}>
      <ResponsivePie
        colors={colors}
        theme={theme}
        data={data}
        value={props.referentiel}
        margin={{ top: 40, right: 85, bottom: 80, left: 85 }}
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
        arcLinkLabelsDiagonalLength={0}
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
        legends={[bottomLegend]}
      />
    </div>
  );
}
