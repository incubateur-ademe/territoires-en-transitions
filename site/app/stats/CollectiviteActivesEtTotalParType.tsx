'use client';

import useSWR from 'swr';
import { ResponsiveWaffleHtml } from '@nivo/waffle';
import { supabase } from '../initSupabase';
import { colors } from './shared';

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
    const epcis = data.filter((d) => d.type_collectivite == 'EPCI')[0];

    return {
      categories: [
        {
          id: epcis.type_collectivite + '_activees',
          label: epcis.type_collectivite + ' activés',
          value: epcis.actives,
        },
        {
          id: epcis.type_collectivite + '_restantes',
          label: epcis.type_collectivite + ' inactifs',
          value: epcis.total - epcis.actives,
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

  return (
    <div style={{ height: 100 + '%' }}>
      <ResponsiveWaffleHtml
        colors={colors}
        data={data.categories}
        total={data.total}
        rows={10}
        columns={10}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        animate={false}
      />
    </div>
  );
}
