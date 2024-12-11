'use client';

import LineChart from '@/site/components/charts/LineChart';
import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { ChartTitle } from './headings';
import { colors, formatInteger, fromMonth } from './shared';
import { addLocalFilters } from './utils';

function useValeursIndicateursRenseignees(
  codeRegion: string,
  codeDepartement: string
) {
  return useSWR(
    `stats_locales_evolution_resultat_indicateur_referentiel-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_evolution_resultat_indicateur_referentiel')
        .select()
        .gte('mois', fromMonth);

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const { data, error } = await select;

      if (error) {
        throw new Error(
          'stats_locales_evolution_resultat_indicateur_referentiel'
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

type ValeursIndicateursRenseigneesProps = {
  region?: string;
  department?: string;
};

export default function ValeursIndicateursRenseignees({
  region = '',
  department = '',
}: ValeursIndicateursRenseigneesProps) {
  const { data } = useValeursIndicateursRenseignees(region, department);

  if (!data) return null;

  return (
    <>
      <ChartTitle>
        <b>{formatInteger(data[0].last)}</b> valeurs d’indicateurs des
        référentiels renseignés
      </ChartTitle>

      <div className="h-[400px]">
        <LineChart
          data={data}
          customColors={colors}
          axisLeftLabel="Valeurs d’indicateurs renseignées"
          enablePoints
        />
      </div>
    </>
  );
}
