'use client';

import useSWR from 'swr';
import {ResponsiveWaffle} from '@nivo/waffle';
import {supabase} from '../initSupabase';
import {bottomLegend, theme} from './shared';

function useCollectiviteActivesEtTotalParType() {
  return useSWR(
    `stats_locales_collectivite_actives_et_total_par_type`,
    async () => {
      const {data, error} = await supabase
        .from('stats_locales_collectivite_actives_et_total_par_type')
        .select()
        // sélectionne les stats nationales
        .is('code_region', null)
        .is('code_departement', null);
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
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
    }
  );
}

export default function CollectiviteActivesEtTotalParType() {
  const {data} = useCollectiviteActivesEtTotalParType();

  if (!data) {
    return null;
  }

  const {categories, total} = data;
  return (
    <div style={{height: 400}}>
      <ResponsiveWaffle
        colors={['#21AB8E', '#FF732C']}
        theme={theme}
        data={categories}
        total={total || 0}
        rows={10}
        columns={10}
        margin={{top: 0, right: 30, bottom: 10, left: 30}}
        animate={false}
        // @ts-ignore: la propriété `legends` est absente du typage (@nivo/waffle:0.80.0) mais bien supportée
        legends={[{...bottomLegend, translateY: 5}]}
      />
    </div>
  );
}
