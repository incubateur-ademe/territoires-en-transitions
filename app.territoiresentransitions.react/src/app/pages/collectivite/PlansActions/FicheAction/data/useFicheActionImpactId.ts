import { supabaseClient } from 'core-logic/api/supabase';
import { useQuery } from 'react-query';
import { objectToCamel } from 'ts-case-convert';

export const useFicheActionImpactId = (ficheId: number | null) =>
  useQuery(['action_impact_fiche_action', ficheId], async () => {
    if (!ficheId) return;
    const data = await fetchActionImpactId([ficheId]);

    return data?.[0]?.actionImpactId;
  });

export const fetchActionImpactId = async (ficheIds: (number | null)[]) => {
  const { data, error } = await supabaseClient
    .from('action_impact_fiche_action')
    .select()
    .in('fiche_id', ficheIds);

  if (error) {
    console.error(error);
    throw error;
  }

  return objectToCamel(data);
};
