import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';
import { objectToCamel } from 'ts-case-convert';

export const useFicheActionImpactId = (ficheId: number) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['action_impact_fiche_action', ficheId],

    queryFn: async () => {
      if (!ficheId) return;
      const data = await fetchActionImpactId(supabase, [ficheId]);

      return data?.[0]?.actionImpactId || null;
    },
  });
};

export const fetchActionImpactId = async (
  supabase: DBClient,
  ficheIds: number[]
) => {
  const { data, error } = await supabase
    .from('action_impact_fiche_action')
    .select()
    .in('fiche_id', ficheIds);

  if (error) {
    console.error(error);
    throw error;
  }

  return objectToCamel(data);
};
