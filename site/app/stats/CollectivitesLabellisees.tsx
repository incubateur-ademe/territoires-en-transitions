'use client';

import useSWR from 'swr';
import {ResponsivePie} from '@nivo/pie';
import {supabase} from '../initSupabase';
import {theme} from './shared';

function useCollectivitesLabellisees(referentiel: Props['referentiel']) {
  const {data} = useSWR(
    'stats_labellisation_par_niveau-' + referentiel,
    async () => {
      const {data, error} = await supabase
        .from('stats_labellisation_par_niveau')
        .select()
        .gte('etoiles', 1)
        .eq('referentiel', referentiel)
        .order('etoiles', {ascending: true});
      if (error) {
        throw new Error('stats_labellisation_par_niveau');
      }
      if (!data) {
        return null;
      }
      return data;
    }
  );

  return data?.map(d => ({
    id: d.etoiles,
    label: `${d.etoiles} étoile${(d.etoiles || 0) > 1 ? 's' : ''}`,
    value: d.labellisations,
  }));
}

type Props = {referentiel: 'eci' | 'cae'};

export default function CollectivitesLabellisees(props: Props) {
  const {referentiel} = props;
  const data = useCollectivitesLabellisees(referentiel);

  if (!data) {
    return null;
  }

  return (
    <div style={{height: 300}}>
      <ResponsivePie
        colors={['#21AB8E', '#34BAB5', '#FFCA00', '#FFB7AE', '#FF732C']}
        theme={theme}
        data={data}
        margin={{top: 40, right: 85, bottom: 80, left: 85}}
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
        arcLinkLabelsDiagonalLength={16}
        arcLinkLabelsStraightLength={14}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{from: 'color'}}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        tooltip={() => null}
        startAngle={-10}
      />
    </div>
  );
}
