'use client';

import useSWR from 'swr';
import { ResponsiveLine } from '@nivo/line';
import { supabase } from '../initSupabase';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  colors,
  fromMonth,
  theme,
} from './shared';

function useNombreUtilisateurParCollectivite() {
  return useSWR(
    'stats_evolution_nombre_utilisateur_par_collectivite',
    async () => {
      const { data, error } = await supabase
        .from('stats_evolution_nombre_utilisateur_par_collectivite')
        .select()
        .gte('mois', fromMonth);
      if (error) {
        throw new Error('stats_evolution_nombre_utilisateur_par_collectivite');
      }
      if (!data) {
        return null;
      }
      return {
        courant: data[data.length - 1],
        evolution: [
          {
            id: 'moyen',
            data: data.map((d) => ({ x: d.mois, y: d.moyen })),
          },
          {
            id: 'maximum',
            data: data.map((d) => ({ x: d.mois, y: d.maximum })),
          },
        ],
      };
    }
  );
}

const labels = {
  moyen: "Nombre moyen d'utilisateurs",
  maximum: "Nombre maximum d'utilisateurs",
};

export default function NombreUtilisateurParCollectivite() {
  const { data } = useNombreUtilisateurParCollectivite();

  if (!data) {
    return null;
  }

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--center">
        <h6>
          {data.courant?.moyen?.toFixed(2)} utilisateurs en moyenne par
          collectivité,&nbsp;
          {data.courant?.maximum} maximum
        </h6>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveLine
          colors={colors}
          theme={theme}
          data={data.evolution}
          // les marges servent aux légendes
          margin={{ top: 5, right: 5, bottom: 50, left: 50 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
          }}
          // on interpole la ligne de façon bien passer sur les points
          curve="monotoneX"
          enablePoints={false}
          enableGridY={false}
          yFormat=" >-.2f"
          axisTop={null}
          axisRight={null}
          axisBottom={axisBottomAsDate}
          axisLeft={axisLeftMiddleLabel("Nombre d'utilisateurs moyen")}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={3}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          enableSlices="x"
          sliceTooltip={({ slice }) => {
            return (
              <div
                style={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                }}
              >
                {slice.points.map((point) => (
                  <div
                    key={point.id}
                    style={{
                      color: point.serieColor,
                      padding: '3px 0',
                    }}
                  >
                    {labels[point.serieId as keyof typeof labels]}:{' '}
                    {point.data.yFormatted}
                  </div>
                ))}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
