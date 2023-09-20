import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { Enums, Tables, Views } from '../_shared/typeUtils.ts';
import { indexBy } from '../_shared/indexBy.ts';
import {
  fetchActionsReferentiel,
  fetchCommentaires,
  fetchPreuves,
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

  // il faut appeler cette RPC sinon le fetch des scores et des auditeurs échoue...
  // TODO: à supprimer quand le problème sera résolu
  await fetchParcours(supabaseClient, collectivite_id);

  const scores = await fetchComparaisonScoreAudit(
    supabaseClient,
    collectivite_id,
    referentiel
  );

  const auditeurs = await fetchAuditeurs(
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

  return {
    collectivite,
    actionsParId: indexBy(actions || [], 'action_id'),
    commentairesParActionId: indexBy(commentaires || [], 'action_id'),
    scores,
    auditeurs,
    getPreuvesParActionId,
  };
};

export type TExportData = Awaited<ReturnType<typeof fetchData>>;

// charge les parcours (eci/cae) de labellisation d'une collectivité donnée
const fetchParcours = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number
) => {
  const { data, error } = await supabaseClient
    .rpc('labellisation_parcours', {
      collectivite_id,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

/**
 * Charge les scores avant/pendant audit
 */
type TScore = Tables<'type_tabular_score'>;
export type TComparaisonScoreAudit = Views<'comparaison_scores_audit'> & {
  action_id: string;
  pre_audit: TScore;
  courant: TScore;
};
const fetchComparaisonScoreAudit = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number,
  referentiel: Enums<'referentiel'>
) => {
  const { error, data } = await supabaseClient
    .from('comparaison_scores_audit')
    .select('action_id,courant,pre_audit')
    .match({ collectivite_id, referentiel });

  if (error) {
    throw new Error(error.message);
  }

  return data as TComparaisonScoreAudit[];
};

/**
 * Charge les auditeurs associés à la collectivité et au référentiel
 */
export type TAuditeur = { nom: string; prenom: string };
const fetchAuditeurs = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number,
  referentiel: Enums<'referentiel'>
) => {
  const { data, error } = await supabaseClient
    .from('auditeurs')
    .select('noms')
    .match({ collectivite_id, referentiel })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data[0]?.noms as TAuditeur[]) || [];
};
