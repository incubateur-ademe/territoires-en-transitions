'use client';

import ChartWithLegend from '@/site/components/charts/ChartWithLegend';
import LineChart from '@/site/components/charts/LineChart';
import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { ChartHead } from './headings';
import { colors, fromMonth } from './shared';
import { addLocalFilters } from './utils';

export function useActiveUsers(codeRegion: string, codeDepartement: string) {
  return useSWR(
    `stats_locales_evolution_utilisateur-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_utilisateur')
        .select()
        .gte('mois', fromMonth);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const { data, error } = await select;

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
            id: 'Nouveaux utilisateurs',
            data: data.map((d) => ({ x: d.mois, y: d.utilisateurs })),
          },
          {
            id: 'Total utilisateurs',
            data: data.map((d) => ({ x: d.mois, y: d.total_utilisateurs })),
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
  const { data } = useActiveUsers(region, department);

  if (!data) {
    return null;
  }

  const { precedent, courant, evolution } = data;

  return (
    <div>
      <ChartHead>
        La plateforme est utilisée par&nbsp;
        {courant?.total_utilisateurs} personne
        {courant?.total_utilisateurs !== 1 && 's'}, dont&nbsp;
        {precedent?.utilisateurs}
        {precedent?.utilisateurs === 1 ? ' nous a' : ' nous ont'} rejoint le
        mois dernier
      </ChartHead>

      <ChartWithLegend
        graph={(colors) => (
          <LineChart
            data={evolution}
            customColors={colors}
            axisLeftLabel="Nombre d'utilisateurs actifs"
            enablePoints
          />
        )}
        labels={evolution.map((e) => e.id)}
        customColors={colors}
        containerClassname="mt-8 mb-12"
        graphContainerClassname="h-[400px]"
        legendContainerClassname="md:grid-flow-col max-md:mx-6 max-md:flex"
        title="Évolution du nombre d'utilisateurs actifs"
      />
    </div>
  );
}
