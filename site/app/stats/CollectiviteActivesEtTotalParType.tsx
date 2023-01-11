'use client';

import useSWR from 'swr';
import { ResponsiveWaffle } from '@nivo/waffle';
import { supabase } from '../initSupabase';
import { bottomLegend, theme } from './shared';

function useCollectiviteActivesEtTotalParType() {
  return useSWR('stats_collectivite_actives_et_total_par_type', async () => {
    const { data, error } = await supabase
      .from('stats_collectivite_actives_et_total_par_type')
      .select();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }
    const epcis = data.filter((d) => d.type_collectivite === 'EPCI')[0];

    return {
      categories: [
        {
          id: epcis.type_collectivite + ' activés',
          label: epcis.type_collectivite + ' activés',
          value: epcis.actives,
        },
        {
          id: epcis.type_collectivite + ' inactifs',
          label: epcis.type_collectivite + ' inactifs',
          value: (epcis.total || 0) - (epcis.actives || 0),
        },
      ],
      total: epcis.total,
    };
  });
}

export default function CollectiviteActivesEtTotalParType() {
  const { data } = useCollectiviteActivesEtTotalParType();

  if (!data) {
    return null;
  }

  const { categories, total } = data;
  return (
    <div style={{ height: 400 }}>
      <ResponsiveWaffle
        colors={['#21AB8E', '#FF732C']}
        theme={theme}
        data={categories}
        total={total || 0}
        rows={10}
        columns={10}
        margin={{ top: 0, right: 30, bottom: 10, left: 30 }}
        animate={false}
        // @ts-ignore: la propriété `legends` est absente du typage (@nivo/waffle:0.80.0) mais bien supportée
        legends={[{ ...bottomLegend, translateY: 5 }]}
      />
    </div>
  );
}
