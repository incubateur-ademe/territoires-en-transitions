import {supabaseClient} from 'core-logic/api/supabase';
import {TComparaisonScoreAudit} from './types';

// charge les comparaisons de potentiels/scores avant/après audit
export const fetchComparaisonScoreAudit = async (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const {error, data} = await supabaseClient
    .from('comparaison_scores_audit')
    .select('action_id,courant,pre_audit')
    .match({collectivite_id, referentiel});

  if (error) {
    throw new Error(error.message);
  }

  return data as TComparaisonScoreAudit[];
};
