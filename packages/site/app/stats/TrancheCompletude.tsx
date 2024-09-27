'use client';

import useSWR from 'swr';
import { ResponsivePie } from '@nivo/pie';
import { supabase } from '../initSupabase';
import { theme } from './shared';
import { addLocalFilters } from './utils';

export function useTrancheCompletude(
  codeRegion: string,
  codeDepartement: string
) {
  return useSWR(
    `stats_locales_tranche_completude-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_tranche_completude')
        .select()
        .gt('lower_bound', 0)
        .order('lower_bound', { ascending: false });

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const { data, error } = await select;

      if (error) {
        throw new Error('stats_tranche_completude');
      }
      if (!data || !data.length) {
        return null;
      }
      return {
        tranches: data.map((d) => {
          return {
            id: d.lower_bound,
            label:
              d.lower_bound +
              `${d.upper_bound ? '-' + d.upper_bound : ''}` +
              '%',
            eci: d.eci ?? 0,
            cae: d.cae ?? 0,
          };
        }),
        inities: getSum(data),
        termines: getSum(data.filter((d) => d.lower_bound === 100)),
        presqueTermines: getSum(
          data.filter((d) => d.lower_bound !== null && d.lower_bound >= 80)
        ),
      };
    }
  );
}

// somme des compteurs par référentiel pour calculer les décomptes
// initiés/terminés/remplis à 80% et plus
const getSum = (data: Array<{ cae: number | null; eci: number | null }>) =>
  data.reduce((cnt, d) => cnt + (d.cae ?? 0) + (d.eci ?? 0), 0);

type Props = {
  referentiel: 'eci' | 'cae';
  region?: string;
  department?: string;
};

export default function TrancheCompletude({
  referentiel,
  region = '',
  department = '',
}: Props) {
  const { data } = useTrancheCompletude(region, department);
  if (!data) return null;

  let tranches = data.tranches;

  // Si le référentiel ne contient pas de données,
  // on affiche une seule tranche : NA
  if (
    (referentiel === 'eci' &&
      !data.tranches.filter((tr) => tr.eci !== 0).length) ||
    (referentiel === 'cae' &&
      !data.tranches.filter((tr) => tr.cae !== 0).length)
  ) {
    tranches = [
      {
        id: 1,
        label: 'NA',
        eci: 1,
        cae: 1,
      },
    ];
  }

  return (
    <div style={{ height: 300 }}>
      <ResponsivePie
        colors={
          !tranches.filter((tr) => tr.label === 'NA').length
            ? ['#21AB8E', '#34BAB5', '#FFCA00', '#FFB7AE', '#FF732C']
            : ['#CCC']
        }
        theme={theme}
        data={tranches}
        value={referentiel}
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
        animate={false}
        enableArcLabels={
          !data.tranches.filter((tr) => tr.label === 'NA').length
        }
      />
    </div>
  );
}
