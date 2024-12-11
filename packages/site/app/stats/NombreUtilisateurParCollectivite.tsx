'use client';

import ChartWithLegend from '@/site/components/charts/ChartWithLegend';
import LineChart from '@/site/components/charts/LineChart';
import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { ChartHead } from './headings';
import { fromMonth } from './shared';
import { addLocalFilters } from './utils';

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

      const { data, error } = await select;

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
            id: "Nombre moyen d'utilisateurs",
            data: data.map((d) => ({ x: d.mois, y: d.moyen })),
          },
          {
            id: "Nombre maximum d'utilisateurs",
            data: data.map((d) => ({ x: d.mois, y: d.maximum })),
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
  const { data } = useNombreUtilisateurParCollectivite(region, department);

  if (!data) return null;

  const { courant, evolution } = data;
  const colors = ['#FF732C', '#7AB1E8'];

  return (
    <div>
      <ChartHead>
        Chaque collectivité compte en moyenne&nbsp;
        {courant?.moyen?.toFixed(2)} utilisateur{courant?.moyen !== 1 && 's'},
        avec un maximum de {courant?.maximum} utilisateur
        {courant?.maximum !== 1 && 's'} 💪
      </ChartHead>
      <div className="fr-grid-row fr-grid-row--center"></div>

      <ChartWithLegend
        graph={(colors) => (
          <LineChart
            data={evolution}
            yFormat=" >-.2f"
            customColors={colors}
            axisLeftLabel="Utilisateurs / collectivité"
            enablePoints
          />
        )}
        labels={evolution.map((e) => e.id)}
        customColors={colors}
        containerClassname="mt-8"
        graphContainerClassname="h-[400px]"
        legendContainerClassname="md:grid-flow-col max-md:mx-6 max-md:flex"
      />
    </div>
  );
}
