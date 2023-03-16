import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

// charge les scores d'une collectivité et un référentiel
export const useCollectiviteScores = (
  collectivite_id: number | null,
  referentiel: string | null
) =>
  useQuery(['collectivite_scores', collectivite_id, referentiel], () =>
    fetchScore(collectivite_id, referentiel).then(
      data => data as TCollectiviteScore[]
    )
  );

export const fetchScore = async (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  if (!collectivite_id || !referentiel) {
    return [];
  }

  const query = supabaseClient
    .from('action_statuts')
    .select(
      'action_id,points_max_referentiel,points_max_personnalises,points_realises,score_realise,points_programmes,score_programme,avancement,concerne,desactive'
    )
    .match({collectivite_id, referentiel});

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// extrait le type d'une ligne depuis le type de retour du fetch
// (ce type ne contient que la sélection de colonnes du `select`)
export type TCollectiviteScore = Awaited<ReturnType<typeof fetchScore>>[0];
