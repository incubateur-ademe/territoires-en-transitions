'use client';

import ChartWithLegend from '@/site/components/charts/ChartWithLegend';
import { theme } from '@/site/components/charts/chartsTheme';
import { ResponsiveWaffle } from '@nivo/waffle';
import useSWR from 'swr';
import { supabase } from '../initSupabase';

function useCollectiviteActivesEtTotalParType() {
  return useSWR(
    `stats_locales_collectivite_actives_et_total_par_type`,
    async () => {
      const select = supabase
        .from('stats_locales_evolution_total_activation')
        .select('total_epci')
        .order('mois', { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await select;

      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        return null;
      }

      const epcis_active = data.total_epci ?? 0;
      const epcis_totales = 1253;

      return {
        categories: [
          {
            id: 'EPCI à fiscalité propre actives',
            label: 'EPCI à fiscalité propre actives',
            value: epcis_active,
          },
          {
            id: 'EPCI à fiscalité propre inactives',
            label: 'EPCI à fiscalité propre inactives',
            value: epcis_totales - epcis_active,
          },
        ],
        total: epcis_totales,
      };
    }
  );
}

export default function CollectiviteActivesEtTotalParType() {
  const { data } = useCollectiviteActivesEtTotalParType();

  if (!data) return null;

  const { categories, total } = data;

  return (
    <ChartWithLegend
      graph={(colors) => (
        <ResponsiveWaffle
          colors={colors}
          theme={theme}
          data={categories}
          total={total || 0}
          rows={10}
          columns={10}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          animate={true}
        />
      )}
      labels={categories.map((c) => c.id)}
      customColors={['#889FC2', '#D9D9D9']}
      containerClassname="mt-6"
      graphContainerClassname="h-[400px]"
      legendContainerClassname="flex-col"
    />
  );
}
