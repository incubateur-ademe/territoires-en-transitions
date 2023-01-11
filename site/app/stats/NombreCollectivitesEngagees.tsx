'use client';

import useSWR from 'swr';
import { supabase } from '../initSupabase';
import { colors } from './shared';

// Nombre de collectivités engagées dans le programme (COT ou labellisée 1ère étoile dans un des deux référentiels)
function useCollectivitesEngagees() {
  return useSWR('stats_engagement_collectivite', async () => {
    const { count, error } = await supabase
      .from('stats_engagement_collectivite')
      .select(undefined, { head: true, count: 'estimated' })
      .or('etoiles_eci.gte.1, etoiles_cae.gte.1, cot.eq.true');
    if (error) {
      throw new Error('stats_engagement_collectivite');
    }
    return count || 0;
  });
}

export default function NombreCollectivitesEngagees() {
  const { data } = useCollectivitesEngagees();

  return (
    <div
      style={{
        color: colors[0],
        fontSize: '4rem',
        fontWeight: 'bold',
        height: 250,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {data}
    </div>
  );
}
