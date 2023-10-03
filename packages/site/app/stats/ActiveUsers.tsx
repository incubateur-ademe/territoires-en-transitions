'use client';

import useSWR from 'swr';
import {ResponsiveLine} from '@nivo/line';
import {supabase} from '../initSupabase';
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
import {SliceTooltip} from './SliceTooltip';
import {addLocalFilters} from './utils';

function useActiveUsers(codeRegion: string, codeDepartement: string) {
  return useSWR(
    `stats_locales_evolution_utilisateur-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_utilisateur')
        .select()
        .gte('mois', fromMonth);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const {data, error} = await select;

      if (error) {
        throw new Error('stats_evolution_utilisateur');
      }
      if (!data || !data.length) {
        return null;
      }
      return {
        precedent: data[data.length - 2],
        courant: data[data.length - 1],
        evolution: [
          {
            id: 'utilisateurs',
            label: 'Nouveaux utilisateurs',
            data: data.map(d => ({x: d.mois, y: d.utilisateurs})),
          },
          {
            id: 'total_utilisateurs',
            label: 'Total utilisateurs',
            data: data.map(d => ({x: d.mois, y: d.total_utilisateurs})),
          },
        ],
      };
    }
  );
}

type ActiveUsersProps = {
  region?: string;
  department?: string;
};

export default function ActiveUsers({
  region = '',
  department = '',
}: ActiveUsersProps) {
  const {data} = useActiveUsers(region, department);

  if (!data) {
    return null;
  }

  const {precedent, courant, evolution} = data;
  const legendData = getLegendData(evolution);
  const labelById = getLabelsById(evolution);

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--center">
        <h6>
          La plateforme est utilisée par&nbsp;
          {courant?.total_utilisateurs} personne
          {courant?.total_utilisateurs !== 1 && 's'}, dont&nbsp;
          {precedent?.utilisateurs}
          {precedent?.utilisateurs === 1 ? ' nous a' : ' nous ont'} rejoint le
          mois dernier
        </h6>
      </div>
      <div style={{height: 400}}>
        <ResponsiveLine
          theme={theme}
          colors={colors}
          data={evolution}
          // les marges servent aux légendes
          margin={{top: 5, right: 5, bottom: 85, left: 50}}
          xScale={{type: 'point'}}
          yScale={{
            type: 'linear',
            min: 0,
            max: 'auto',
            stacked: false,
          }}
          // on interpole la ligne de façon bien passer sur les points
          curve="monotoneX"
          lineWidth={4}
          pointSize={4}
          yFormat=" >-.0f"
          axisBottom={axisBottomAsDate}
          axisLeft={axisLeftMiddleLabel("Nombre d'utilisateurs actifs")}
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
              translateY: 85,
              itemWidth: 180,
            },
          ]}
          animate={false}
        />
      </div>
    </div>
  );
}
