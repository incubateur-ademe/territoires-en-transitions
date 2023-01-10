'use client';

import useSWR from 'swr';
import { ResponsiveLine } from '@nivo/line';
import { supabase } from '../initSupabase';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  bottomLegend,
  colors,
  dateAsMonthAndYear,
  fromMonth,
} from './shared';
import { SliceTooltip } from './SliceTooltip';

function useValeursIndicateursPersoRenseignees() {
  return useSWR(
    'stats_evolution_resultat_indicateur_personnalise',
    async () => {
      const { data, error } = await supabase
        .from('stats_evolution_resultat_indicateur_personnalise')
        .select()
        .gte('mois', fromMonth);
      if (error) {
        throw new Error('stats_evolution_resultat_indicateur_personnalise');
      }
      if (!data) {
        return null;
      }
      return [
        {
          id: 'indicateurs_perso',
          label: "Valeurs d'indicateurs personnalisés renseignées",
          data: data
            .filter((d) => d.mois === null || d.resultats === null)
            .map((d) => ({ x: d.mois, y: d.resultats })),
        },
      ];
    }
  );
}

export default function ValeursIndicateursPersoRenseignees() {
  const { data } = useValeursIndicateursPersoRenseignees();

  if (!data) {
    return null;
  }

  return (
    <div style={{ height: 450 }}>
      <ResponsiveLine
        colors={colors}
        data={data}
        // les marges servent aux légendes
        margin={{ top: 5, right: 5, bottom: 85, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
        }}
        // on interpole la ligne de façon bien passer sur les points
        curve="monotoneX"
        lineWidth={4}
        pointSize={4}
        yFormat=" >-.0f"
        axisBottom={axisBottomAsDate}
        axisLeft={axisLeftMiddleLabel(
          'Valeurs d’indicateurs personnalisés des référentiels renseignés'
        )}
        pointBorderWidth={4}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableSlices="x"
      />
    </div>
  );
}
