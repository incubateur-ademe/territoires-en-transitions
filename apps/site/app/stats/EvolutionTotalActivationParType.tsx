'use client';

import { statsColors, theme } from '@/site/components/charts/chartsTheme';
import ChartWithLegend from '@/site/components/charts/ChartWithLegend';
import LineChart from '@/site/components/charts/LineChart';
import { SliceTooltipProps } from '@nivo/line';
import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { ChartHead } from './headings';
import { fromMonth } from './shared';
import { addLocalFilters } from './utils';

/**
 * L'évolution des activations par type de collectivité
 * Filtrable par département ou région.
 *
 * @param codeRegion le code de la région ou ''
 * @param codeDepartement le code du département ou ''
 */
export function useEvolutionTotalActivation(
  codeRegion: string,
  codeDepartement: string
) {
  return useSWR(
    `stats_locales_evolution_total_activation-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_total_activation')
        .select()
        .gte('mois', fromMonth);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const { data, error } = await select;

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
            id: 'EPCI à fiscalité propre',
            data: data.map((d) => ({ x: d.mois, y: d.total_epci })),
          },
          {
            id: 'Communes',
            data: data.map((d) => ({ x: d.mois, y: d.total_commune })),
          },
          {
            id: 'Syndicats',
            data: data.map((d) => ({ x: d.mois, y: d.total_syndicat })),
          },
          {
            id: 'Autres collectivités',
            data: data.map((d) => ({ x: d.mois, y: d.total_autre })),
          },
        ],
      };
    }
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
  const { data } = useEvolutionTotalActivation(region, department);

  if (!data) return null;

  const { courant, evolution } = data;

  return (
    <div>
      <ChartHead>
        {courant.total}{' '}
        {courant.total !== 1
          ? 'collectivités activées'
          : 'collectivité activée'}{' '}
        dont {courant.total_epci} EPCI,&nbsp;
        {courant.total_commune} commune{courant.total_commune !== 1 && 's'},{' '}
        {courant.total_syndicat} syndicat{courant.total_syndicat !== 1 && 's'}{' '}
        et {courant.total_autre} autre{courant.total_autre !== 1 && 's'}
      </ChartHead>

      <ChartWithLegend
        graph={(colors) => (
          <LineChart
            data={evolution}
            customColors={colors}
            axisLeftLabel="Évolution des collectivités activées"
            stacked
            enableArea
            customTooltip={({ slice }: SliceTooltipProps) => {
              return (
                <div style={theme.tooltip?.container}>
                  <div>
                    <strong>
                      {slice.points
                        .map((p) => p.data.y as number)
                        .reduce((a, b) => a + b, 0)}
                    </strong>{' '}
                    collectivités, dont :
                  </div>
                  {slice.points.map((point) => (
                    <div
                      key={point.id}
                      style={{
                        color: point.serieColor,
                        padding: '3px 0',
                      }}
                    >
                      {point.data.yFormatted} {point.serieId}
                    </div>
                  ))}
                </div>
              );
            }}
          />
        )}
        labels={evolution.map((e) => e.id)}
        customColors={statsColors}
        containerClassname="mt-8 mb-12"
        graphContainerClassname="h-[400px]"
        legendContainerClassname="md:grid-flow-col max-md:mx-6 max-md:flex"
      />
    </div>
  );
}
