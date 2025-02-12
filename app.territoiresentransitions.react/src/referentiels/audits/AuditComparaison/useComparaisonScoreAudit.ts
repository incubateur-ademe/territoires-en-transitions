import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';
import { TComparaisonScoreAudit } from './types';

// charge les comparaisons de potentiels/scores avant/après audit
export const useComparaisonScoreAudit = (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const supabase = useSupabase();
  return useQuery(
    ['comparaison_scores_audit', collectivite_id, referentiel],
    () => fetchComparaisonScoreAudit(supabase, collectivite_id, referentiel)
  );
};

export const fetchComparaisonScoreAudit = async (
  supabase: DBClient,
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const query = supabase
    .from('comparaison_scores_audit')
    .select('action_id,courant,pre_audit')
    .match({ collectivite_id, referentiel });

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data as TComparaisonScoreAudit[];
};
