import {supabaseClient} from 'core-logic/api/supabase';
import {useQuery} from 'react-query';

export const useFicheActionImpactId = (ficheId: number | null) =>
  useQuery(['action_impact_fiche_action', ficheId], async () => {
    if (!ficheId) return;
    const {data, error} = await fetchActionImpactId([ficheId]);
    if (error) {
      throw new Error(error.message);
    }

    return data?.[0]?.action_impact_id;
  });

export const fetchActionImpactId = (ficheIds: (number | null)[]) =>
  supabaseClient
    .from('action_impact_fiche_action')
    .select()
    .in('fiche_id', ficheIds);
