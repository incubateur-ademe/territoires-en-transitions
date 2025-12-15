'use client';

import LineChart from '@/site/components/charts/LineChart';
import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { colors } from './shared';
import { addLocalFilters } from './utils';

type Vue =
  | 'stats_locales_evolution_nombre_fiches'
  | 'stats_locales_evolution_collectivite_avec_minimum_fiches'
  | 'stats_evolution_nombre_plans';

const colonneValeur = {
  stats_locales_evolution_nombre_fiches: 'fiches',
  stats_locales_evolution_collectivite_avec_minimum_fiches: 'collectivites',
  stats_evolution_nombre_plans: 'plans',
};

const legende = {
  stats_locales_evolution_nombre_fiches: "Nombre total d'actions",
  stats_locales_evolution_collectivite_avec_minimum_fiches:
    'Collectivités avec cinq actions ou plus',
  stats_evolution_nombre_plans: 'Historique du nombre de plans',
};

const labels = {
  actions: 'Actions',
  collectivites: 'Collectivités',
  plans: 'Plans',
};

export function useEvolutionFiches(
  vue: Vue,
  codeRegion: string,
  codeDepartement: string
) {
  return useSWR(`${vue}-${codeRegion}-${codeDepartement}`, async () => {
    let select = supabase.from(vue).select().gte('mois', '2023-01-01');

    if (vue !== 'stats_evolution_nombre_plans') {
      select = addLocalFilters(select, codeDepartement, codeRegion);
    }

    const { data, error } = await select;

    if (error) {
      throw new Error(vue);
    }
    if (!data || !data.length) {
      return null;
    }
    return {
      evolution: [
        {
          id: labels[colonneValeur[vue] as keyof typeof labels],
          // @ts-expect-error erreur non gérée
          data: data.map((d) => ({ x: d.mois, y: d[colonneValeur[vue]] })),
        },
      ],
      // @ts-expect-error erreur non gérée
      last: data[data.length - 1][colonneValeur[vue]],
    };
  });
}

type Props = { vue: Vue; region?: string; department?: string };

export default function EvolutionFiches({
  vue,
  region = '',
  department = '',
}: Props) {
  const { data } = useEvolutionFiches(vue, region, department);

  if (!data) {
    return null;
  }

  return (
    <div className="h-[400px]">
      <LineChart
        data={data.evolution}
        customColors={colors}
        axisLeftLabel={legende[vue]}
        enablePoints
      />
    </div>
  );
}
