import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { indexBy } from '@/app/utils/indexBy';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from 'react-query';
import { ProgressionRow } from '../DEPRECATED_scores.types';

/**
 * Récupère les entrées d'un référentiel pour une collectivité donnée
 */
const fetchScore = async (
  supabase: DBClient,
  collectivite_id: number | null,
  referentiel: string | null,
  action_id: string | null
) => {
  const { error, data } = await supabase
    .from('action_statuts')
    .select(
      'action_id, concerne, desactive, points_realises, points_max_personnalises, points_max_referentiel'
    )
    .match({ collectivite_id, referentiel })
    .like('action_id', `${action_id}%`);

  if (error) throw new Error(error.message);

  return data as ProgressionRow[];
};

/**
 * Renvoie les scores réalisés et max d'une action donnée
 * @deprecated in favor of `useScore()` using data from snpashot
 */
export const useScoreRealise = (action: ActionDefinitionSummary) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  // Chargement des données
  const { data } = useQuery(
    [
      ...getScoreRealiseQueryKey(collectiviteId, action.referentiel),
      action.id,
      action.depth,
    ],
    () => fetchScore(supabase, collectiviteId, action.referentiel, action.id)
  );

  return (data && indexBy(data, 'action_id')) || {};
};

export const getScoreRealiseQueryKey = (
  collectiviteId: number | null,
  referentiel: ReferentielId
) => ['suivi_score_realise', collectiviteId, referentiel];
