'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {fromMonth} from './shared';
import {addLocalFilters} from './utils';
import {ChartHead} from './headings';
import LineChart from '@components/charts/LineChart';
import {statsColors} from '@components/charts/chartsTheme';
import ChartWithLegend from '@components/charts/ChartWithLegend';

/**
 * L'évolution des activations par type de collectivité
 * Filtrable par département ou région.
 *
 * @param codeRegion le code de la région ou ''
 * @param codeDepartement le code du département ou ''
 */
export function useEvolutionTotalActivation(
  codeRegion: string,
  codeDepartement: string,
) {
  return useSWR(
    `stats_locales_evolution_total_activation-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_total_activation')
        .select()
        .gte('mois', fromMonth);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const {data, error} = await select;

      if (error) {
        throw new Error(error.message);
      }
      if (!data || !data.length) {
        return null;
      }

      return {
        courant: data[data.length - 1],
        evolution: [
          {
            id: 'EPCI',
            data: data.map(d => ({x: d.mois, y: d.total_epci})),
          },
          {
            id: 'Communes',
            data: data.map(d => ({x: d.mois, y: d.total_commune})),
          },
          {
            id: 'Syndicats',
            data: data.map(d => ({x: d.mois, y: d.total_syndicat})),
          },
        ],
      };
    },
  );
}

type EvolutionTotalActivationParTypeProps = {
  region?: string;
  department?: string;
};

export default function EvolutionTotalActivationParType({
  region = '',
  department = '',
}: EvolutionTotalActivationParTypeProps) {
  const {data} = useEvolutionTotalActivation(region, department);

  if (!data) return null;

  const {courant, evolution} = data;

  return (
    <div>
      <ChartHead>
        {courant.total}{' '}
        {courant.total !== 1
          ? 'collectivités activées'
          : 'collectivité activée'}{' '}
        dont {courant.total_epci} EPCI,&nbsp;
        {courant.total_syndicat} syndicat{courant.total_syndicat !== 1 && 's'}{' '}
        et&nbsp;
        {courant.total_commune} commune{courant.total_commune !== 1 && 's'}
      </ChartHead>

      <ChartWithLegend
        graph={colors => (
          <LineChart
            data={evolution}
            customColors={colors}
            stacked
            enableArea
          />
        )}
        labels={evolution.map(e => e.id)}
        customColors={statsColors}
        containerClassname="mt-8 mb-12"
        graphContainerClassname="h-[400px]"
        legendContainerClassname="md:grid-flow-col max-md:mx-6 max-md:flex"
      />
    </div>
  );
}
