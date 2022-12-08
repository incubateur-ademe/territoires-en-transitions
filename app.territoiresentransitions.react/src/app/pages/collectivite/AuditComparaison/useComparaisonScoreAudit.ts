import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TComparaisonScoreAudit} from './types';

// charge les comparaisons de potentiels/scores avant/après audit
export const useComparaisonScoreAudit = (
  collectivite_id: number | null,
  referentiel: string | null
) =>
  useQuery(['comparaison_scores_audit', collectivite_id, referentiel], () =>
    fetchComparaisonScoreAudit(collectivite_id, referentiel)
  );

export const fetchComparaisonScoreAudit = async (
  collectivite_id: number | null,
  referentiel: string | null,
  /** indique que les données doivent être chargées en format csv */
  csv?: boolean
) => {
  const query = supabaseClient
    .from('comparaison_scores_audit')
    .select('action_id,courant,pre_audit')
    .match({collectivite_id, referentiel});

  if (csv) {
    query.csv();
  }

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data as TComparaisonScoreAudit[];
};
