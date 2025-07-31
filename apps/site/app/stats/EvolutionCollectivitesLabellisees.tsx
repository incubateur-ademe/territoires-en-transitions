import { supabase } from '@/site/app/initSupabase';
import BarChart from '@/site/components/charts/BarChart';
import ChartWithLegend from '@/site/components/charts/ChartWithLegend';
import useSWR from 'swr';
import { fromMonth } from './shared';

const useEvolutionCollectivitesLabellisees = (
  codeRegion: string,
  codeDepartement: string
) => {
  return useSWR(
    `stats_evolution_nombre_labellisations-${codeRegion}-${codeDepartement}`,
    async () => {
      const select = supabase
        .from('stats_evolution_nombre_labellisations')
        .select()
        .gte('mois', fromMonth);

      //   select = addLocalFilters(select, codeDepartement, codeRegion);

      const { data, error } = await select;

      if (error) {
        throw new Error(error.message);
      }
      if (!data || !data.length) {
        return null;
      }

      return data
        .filter((d) => d.mois !== null)
        .map((d) => ({
          mois: d.mois,
          '1 étoile': d.etoile_1 ?? 0,
          '2 étoiles': d.etoile_2 ?? 0,
          '3 étoiles': d.etoile_3 ?? 0,
          '4 étoiles': d.etoile_4 ?? 0,
          '5 étoiles': d.etoile_5 ?? 0,
        }));
    }
  );
};

type EvolutionCollectivitesLabelliseesProps = {
  region?: string;
  department?: string;
};

const EvolutionCollectivitesLabellisees = ({
  region = '',
  department = '',
}: EvolutionCollectivitesLabelliseesProps) => {
  const { data } = useEvolutionCollectivitesLabellisees(region, department);

  if (!data) return null;

  return (
    <ChartWithLegend
      graph={(colors) => (
        <BarChart
          data={
            data as {
              mois: string;
              '1 étoile': number;
              '2 étoiles': number;
              '3 étoiles': number;
              '4 étoiles': number;
              '5 étoiles': number;
            }[]
          }
          keys={[
            '1 étoile',
            '2 étoiles',
            '3 étoiles',
            '4 étoiles',
            '5 étoiles',
          ]}
          indexBy="mois"
          customColors={colors}
          axisLeftLabel="Étoiles"
        />
      )}
      labels={['1 étoile', '2 étoiles', '3 étoiles', '4 étoiles', '5 étoiles']}
      customColors={['#21AB8E', '#34BAB5', '#FFCA00', '#FFB7AE', '#FF732C']}
      containerClassname="mt-8"
      graphContainerClassname="h-[400px]"
      legendContainerClassname="md:grid-flow-col max-md:mx-6 max-md:flex"
    />
  );
};

export default EvolutionCollectivitesLabellisees;
