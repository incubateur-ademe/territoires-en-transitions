'use client';

import useSWR from 'swr';
import {ResponsiveLine} from '@nivo/line';
import {supabase} from '../initSupabase';
import {
  axisBottomAsDate,
  axisLeftMiddleLabel,
  bottomLegend,
  fromMonth,
  getLabelsById,
  getLegendData,
  theme,
} from './shared';
import {SliceTooltip} from './SliceTooltip';
import {ChartHead} from './headings';
import {addLocalFilters} from './utils';

function useNombreUtilisateurParCollectivite(
  codeRegion: string,
  codeDepartement: string
) {
  return useSWR(
    `stats_locales_evolution_nombre_utilisateur_par_collectivite-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_nombre_utilisateur_par_collectivite')
        .select()
        .gte('mois', fromMonth);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const {data, error} = await select;

      if (error) {
        throw new Error('stats_evolution_nombre_utilisateur_par_collectivite');
      }
      if (!data || !data.length) {
        return null;
      }
      return {
        courant: data[data.length - 1],
        evolution: [
          {
            id: 'moyen',
            label: "Nombre moyen d'utilisateurs",
            data: data.map(d => ({x: d.mois, y: d.moyen})),
          },
          {
            id: 'maximum',
            label: "Nombre maximum d'utilisateurs",
            data: data.map(d => ({x: d.mois, y: d.maximum})),
          },
        ],
      };
    }
  );
}

type NombreUtilisateurParCollectiviteProps = {
  region?: string;
  department?: string;
};

export default function NombreUtilisateurParCollectivite({
  region = '',
  department = '',
}: NombreUtilisateurParCollectiviteProps) {
  const {data} = useNombreUtilisateurParCollectivite(region, department);

  if (!data) return null;

  const {courant, evolution} = data;
  const colors = ['#FF732C', '#7AB1E8'];
  const legendData = getLegendData(evolution, colors);
  const labelById = getLabelsById(evolution);

  return (
    <div>
      <ChartHead>
        Chaque collectivité compte en moyenne&nbsp;
        {courant?.moyen?.toFixed(2)} utilisateur{courant?.moyen !== 1 && 's'}
        <br />
        Avec un maximum de {courant?.maximum} utilisateur
        {courant?.maximum !== 1 && 's'} 💪
      </ChartHead>
      <div className="fr-grid-row fr-grid-row--center"></div>

      <div style={{height: 300}}>
        <ResponsiveLine
          colors={colors}
          theme={theme}
          data={evolution}
          // les marges servent aux légendes
          margin={{top: 5, right: 5, bottom: 120, left: 50}}
          xScale={{type: 'point'}}
          yScale={{
            type: 'linear',
            min: 0,
            max: 'auto',
            stacked: false,
          }}
          // on interpole la ligne de façon bien passer sur les points
          curve="monotoneX"
          lineWidth={2}
          pointSize={0}
          enableGridY={false}
          yFormat=" >-.2f"
          axisBottom={axisBottomAsDate}
          axisLeft={axisLeftMiddleLabel('Utilisateurs/collectivité')}
          pointColor={{theme: 'background'}}
          pointBorderWidth={4}
          pointBorderColor={{from: 'serieColor'}}
          pointLabelYOffset={-12}
          enableSlices="x"
          sliceTooltip={props => <SliceTooltip {...props} labels={labelById} />}
          legends={[
            {
              ...bottomLegend,
              data: legendData,
              direction: 'column',
              translateX: -20,
              translateY: 120,
              itemWidth: 230,
            },
          ]}
          animate={false}
        />
      </div>
    </div>
  );
}
