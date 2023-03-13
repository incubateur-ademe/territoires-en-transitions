'use client';

import useSWR from 'swr';
import {supabase} from '../initSupabase';
import {ResponsiveLine} from '@nivo/line';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  bottomLegend,
  colors,
  fromMonth,
  getLabelsById,
  getLegendData,
  theme,
} from './shared';
import {addLocalFilters} from './utils';

/**
 * L'évolution des activations par type de collectivité
 * Filtrable par département ou région.
 *
 * @param codeRegion le code de la région ou ''
 * @param codeDepartement le code du département ou ''
 */
function useEvolutionTotalActivation(
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
            id: 'total_epci',
            label: 'EPCI',
            data: data.map(d => ({x: d.mois, y: d.total_epci})),
          },
          {
            id: 'total_syndicat',
            label: 'syndicats',
            data: data.map(d => ({x: d.mois, y: d.total_syndicat})),
          },
          {
            id: 'total_commune',
            label: 'communes',
            data: data.map(d => ({x: d.mois, y: d.total_commune})),
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
  const {data} = useEvolutionTotalActivation(region, department);

  if (!data) return null;

  const {courant, evolution} = data;
  const legendData = getLegendData(evolution);
  const labelById = getLabelsById(evolution);

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--center">
        <h6>
          {courant.total}{' '}
          {courant.total !== 1
            ? 'collectivités activées'
            : 'collectivité activée'}{' '}
          dont {courant.total_epci} EPCI,&nbsp;
          {courant.total_syndicat} syndicat{courant.total_syndicat !== 1 && 's'}{' '}
          et&nbsp;
          {courant.total_commune} commune{courant.total_commune !== 1 && 's'}
        </h6>
      </div>

      <div style={{height: 400}}>
        <ResponsiveLine
          colors={colors}
          theme={theme}
          data={evolution}
          // les marges servent aux légendes
          margin={{top: 5, right: 5, bottom: 80, left: 50}}
          xScale={{type: 'point'}}
          yScale={{
            type: 'linear',
            min: 0,
            max: 'auto',
            // on empile les lignes pour représenter le total
            stacked: true,
          }}
          // les surfaces sous les lignes sont pleines
          enableArea={true}
          areaOpacity={1}
          // on interpole la ligne de façon bien passer sur les points
          curve="monotoneX"
          enablePoints={false}
          yFormat=" >-.0f"
          axisBottom={axisBottomAsDate}
          axisLeft={axisLeftMiddleLabel('Évolution des collectivités activées')}
          pointColor={{theme: 'background'}}
          pointBorderWidth={3}
          pointBorderColor={{from: 'serieColor'}}
          pointLabelYOffset={-12}
          enableSlices="x"
          sliceTooltip={({slice}) => {
            return (
              <div style={theme.tooltip?.container}>
                <div>
                  <strong>
                    {slice.points
                      .map(p => p.data.y as number)
                      .reduce((a, b) => a + b, 0)}
                  </strong>{' '}
                  collectivités, dont :
                </div>
                {slice.points.map(point => (
                  <div
                    key={point.id}
                    style={{
                      color: point.serieColor,
                      padding: '3px 0',
                    }}
                  >
                    {point.data.yFormatted} {labelById[point.serieId]}
                  </div>
                ))}
              </div>
            );
          }}
          legends={[
            {
              ...bottomLegend,
              translateX: -20,
              translateY: 80,
              itemWidth: 100,
              itemsSpacing: 12,
              data: legendData,
            },
          ]}
          animate={false}
        />
      </div>
    </div>
  );
}
