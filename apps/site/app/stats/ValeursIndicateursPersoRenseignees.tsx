'use client';

import LineChart from '@/site/components/charts/LineChart';
import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { ChartTitle } from './headings';
import { colors, formatInteger, fromMonth } from './shared';
import { addLocalFilters } from './utils';

function useValeursIndicateursPersoRenseignees(
  codeRegion: string,
  codeDepartement: string
) {
  return useSWR(
    `stats_locales_evolution_resultat_indicateur_personnalise-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_resultat_indicateur_personnalise')
        .select()
        .gte('mois', fromMonth);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const { data, error } = await select;

      if (error) {
        throw new Error(
          'stats_locales_evolution_resultat_indicateur_personnalise'
        );
      }
      if (!data || !data.length) {
        return null;
      }
      return [
        {
          id: 'Valeurs renseignées',
          data: data.map((d) => ({ x: d.mois, y: d.indicateurs })),
          last: data[data.length - 1].indicateurs,
        },
      ];
    }
  );
}

type ValeursIndicateursPersoRenseigneesProps = {
  region?: string;
  department?: string;
};

export default function ValeursIndicateursPersoRenseignees({
  region = '',
  department = '',
}: ValeursIndicateursPersoRenseigneesProps) {
  const { data } = useValeursIndicateursPersoRenseignees(region, department);

  if (!data) return null;

  return (
    <>
      <ChartTitle>
        <b>{formatInteger(data[0].last)}</b> indicateurs personnalisés
        renseignés
      </ChartTitle>
      <div className="h-[400px]">
        <LineChart
          data={data}
          customColors={colors}
          axisLeftLabel="Valeurs d’indicateurs personnalisés renseignées"
          enablePoints
        />
      </div>
    </>
  );
}
