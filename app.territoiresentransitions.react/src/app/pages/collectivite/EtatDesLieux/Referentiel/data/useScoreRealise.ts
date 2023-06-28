import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ActionReferentiel} from 'app/pages/collectivite/ReferentielTable/useReferentiel';
import {TActionStatutsRow} from 'types/alias';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {Referentiel} from 'types/litterals';
import {indexBy} from 'utils/indexBy';

export type SuiviScoreRow = ActionReferentiel &
  Pick<
    TActionStatutsRow,
    | 'action_id'
    | 'concerne'
    | 'desactive'
    | 'points_realises'
    | 'points_max_personnalises'
    | 'points_max_referentiel'
  >;

/**
 * Récupère les entrées d'un référentiel pour une collectivité donnée
 */

const fetchScore = async (
  collectivite_id: number | null,
  referentiel: string | null,
  action_id: string | null
) => {
  const {error, data} = await supabaseClient
    .from('action_statuts')
    .select(
      'action_id, concerne, desactive, points_realises, points_max_personnalises, points_max_referentiel'
    )
    .match({collectivite_id, referentiel})
    .like('action_id', `${action_id}%`);

  if (error) throw new Error(error.message);

  return data as SuiviScoreRow[];
};

/**
 * Renvoie les scores réalisés et max d'une action donnée
 */

export const useScoreRealise = (action: ActionDefinitionSummary) => {
  const collectiviteId = useCollectiviteId();

  // Chargement des données
  const {data} = useQuery(
    [
      ...getScoreRealiseQueryKey(collectiviteId, action.referentiel),
      action.id,
      action.depth,
    ],
    () => fetchScore(collectiviteId, action.referentiel, action.id)
  );

  return (data && indexBy(data, 'action_id')) || {};
};

export const getScoreRealiseQueryKey = (
  collectiviteId: number | null,
  referentiel: Referentiel
) => ['suivi_score_realise', collectiviteId, referentiel];
