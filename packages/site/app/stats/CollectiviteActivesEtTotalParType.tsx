'use client';

import useSWR from 'swr';
import {ResponsiveWaffle} from '@nivo/waffle';
import {supabase} from '../initSupabase';
import {addLocalFilters} from './utils';
import ChartWithLegend from '@components/charts/ChartWithLegend';
import {theme} from '@components/charts/chartsTheme';

function useCollectiviteActivesEtTotalParType(
  codeRegion: string,
  codeDepartement: string,
) {
  return useSWR(
    `stats_locales_collectivite_actives_et_total_par_type-${codeRegion}-${codeDepartement}`,
    async () => {
      let select = supabase
        .from('stats_locales_collectivite_actives_et_total_par_type')
        .select();

      select = addLocalFilters(select, codeDepartement, codeRegion);

      const {data, error} = await select;

      if (error) {
        throw new Error(error.message);
      }
      if (!data || !data.length) {
        return null;
      }

      const epcis = data.filter(d => d.typologie === 'EPCI')[0];

      return {
        categories: [
          {
            id: epcis.typologie + ' activés',
            label: epcis.typologie + ' activés',
            value: epcis.actives,
          },
          {
            id: epcis.typologie + ' inactifs',
            label: epcis.typologie + ' inactifs',
            value: (epcis.total || 0) - (epcis.actives || 0),
          },
        ],
        total: epcis.total,
      };
    },
  );
}

type CollectiviteActivesEtTotalParTypeProps = {
  region?: string;
  department?: string;
};

export default function CollectiviteActivesEtTotalParType({
  region = '',
  department = '',
}: CollectiviteActivesEtTotalParTypeProps) {
  const {data} = useCollectiviteActivesEtTotalParType(region, department);

  if (!data) return null;

  const {categories, total} = data;

  return (
    <ChartWithLegend
      graph={colors => (
        <ResponsiveWaffle
          colors={colors}
          theme={theme}
          data={categories}
          total={total || 0}
          rows={10}
          columns={10}
          margin={{top: 0, right: 30, bottom: 10, left: 30}}
          animate={false}
        />
      )}
      labels={categories.map(c => c.id)}
      customColors={['#889FC2', '#D9D9D9']}
      containerClassname="mt-6"
      graphContainerClassname="h-[400px]"
      legendContainerClassname="md:grid-flow-col max-md:mx-6 max-md:flex"
    />
  );
}
