import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ActionReferentiel} from 'app/pages/collectivite/ReferentielTable/useReferentiel';
import {TActionStatutsRow} from 'types/alias';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {Referentiel} from 'types/litterals';

export type SuiviScoreRow = ActionReferentiel &
  Pick<
    TActionStatutsRow,
    'action_id' | 'points_realises' | 'points_max_personnalises'
  >;

/**
 * Récupère les entrées d'un référentiel pour une collectivité donnée
 */

const fetchScore = async (
  collectivite_id: number | null,
  referentiel: string | null,
  depth: number
) => {
  const {error, data} = await supabaseClient
    .from('action_statuts')
    .select('action_id,points_realises,points_max_personnalises')
    .match({collectivite_id, referentiel})
    .eq('depth', depth);

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
      action.depth,
    ],
    () => fetchScore(collectiviteId, action.referentiel, action.depth)
  );

  const filteredData = data ? data.filter(d => d.action_id === action.id) : [];

  return {
    pointsRealises: filteredData[0]?.points_realises ?? null,
    pointsMax: filteredData[0]?.points_max_personnalises ?? null,
  };
};

export const getScoreRealiseQueryKey = (
  collectiviteId: number | null,
  referentiel: Referentiel
) => ['suivi_score_realise', collectiviteId, referentiel];
