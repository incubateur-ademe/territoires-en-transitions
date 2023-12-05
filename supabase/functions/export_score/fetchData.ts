import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { Enums } from '../_shared/typeUtils.ts';
import { indexBy } from '../_shared/indexBy.ts';
import {
  fetchActionsReferentiel,
  fetchCommentaires,
  fetchPreuves,
  getActionParentId,
} from '../_shared/fetchActionsReferentiel.ts';
import { fetchCollectivite } from '../_shared/fetchCollectivite.ts';

/**
 * Charge toutes les données nécessaires à l'export
 */
export const fetchData = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number,
  referentiel: Enums<'referentiel'>
) => {
  const collectivite = await fetchCollectivite(supabaseClient, collectivite_id);
  const actions = await fetchActionsReferentiel(supabaseClient, referentiel);

  const scores = await fetchCurrentScores(
    supabaseClient,
    collectivite_id,
    referentiel
  );

  const commentaires = await fetchCommentaires(
    supabaseClient,
    collectivite_id,
    referentiel
  );
  const { getPreuvesParActionId } = await fetchPreuves(
    supabaseClient,
    collectivite_id,
    referentiel
  );

  const actionsParId = indexBy(actions || [], 'action_id');
  const scoresParId = indexBy(scores || [], 'action_id');
  const getSubActionScore = (taskId: string) => {
    if (actionsParId[taskId]?.type !== 'tache') return;
    const parentId = getActionParentId(taskId);
    return scoresParId[parentId];
  };

  return {
    collectivite,
    actionsParId,
    commentairesParActionId: indexBy(commentaires || [], 'action_id'),
    scores,
    getPreuvesParActionId,
    getSubActionScore,
  };
};

export type TExportData = Awaited<ReturnType<typeof fetchData>>;

/**
 * Charge les scores
 */
export const fetchCurrentScores = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number,
  referentiel: Enums<'referentiel'>
) => {
  const { error, data } = await supabaseClient
    .from('action_statuts')
    .select(
      'action_id,points_max_referentiel,points_max_personnalises,points_realises,score_realise,points_programmes,score_programme,avancement,avancement_descendants,concerne,desactive'
    )
    .match({ collectivite_id, referentiel });

  if (error) {
    throw new Error(error.message);
  }

  type TRow = Omit<(typeof data)[0], 'action_id'> & { action_id: string };
  return data as TRow[];
};
