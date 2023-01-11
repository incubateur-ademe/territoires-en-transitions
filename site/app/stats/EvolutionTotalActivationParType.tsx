'use client';

import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { ResponsiveLine } from '@nivo/line';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  bottomLegend,
  colors,
  dateAsMonthAndYear,
  fromMonth,
  getLabelsById,
  getLegendData,
  theme,
} from './shared';

function useEvolutionTotalActivationParType() {
  return useSWR('stats_evolution_total_activation_par_type', async () => {
    const { data, error } = await supabase
      .from('stats_evolution_total_activation_par_type')
      .select()
      .gte('mois', fromMonth);
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }
    return {
      courant: data[data.length - 1],
      evolution: [
        {
          id: 'total_epci',
          label: 'EPCI',
          data: data.map((d) => ({ x: d.mois, y: d.total_epci })),
        },
        {
          id: 'total_syndicat',
          label: 'syndicats',
          data: data.map((d) => ({ x: d.mois, y: d.total_syndicat })),
        },
        {
          id: 'total_commune',
          label: 'communes',
          data: data.map((d) => ({ x: d.mois, y: d.total_commune })),
        },
      ],
    };
  });
}

export default function EvolutionTotalActivationParType() {
  const { data } = useEvolutionTotalActivationParType();

  if (!data) {
    return null;
  }
  const { courant, evolution } = data;
  const legendData = getLegendData(evolution);
  const labelById = getLabelsById(evolution);

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--center">
        <h6>
          {courant.total} collectivités activées dont {courant.total_epci}{' '}
          EPCI,&nbsp;
          {courant.total_syndicat} syndicats et&nbsp;
          {courant.total_commune} communes
        </h6>
      </div>

      <div style={{ height: 400 }}>
        <ResponsiveLine
          colors={colors}
          theme={theme}
          data={evolution}
          // les marges servent aux légendes
          margin={{ top: 5, right: 5, bottom: 80, left: 50 }}
          xScale={{ type: 'point' }}
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
          pointColor={{ theme: 'background' }}
          pointBorderWidth={3}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          enableSlices="x"
          sliceTooltip={({ slice }) => {
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
        />
      </div>
    </div>
  );
}
