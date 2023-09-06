import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import {
  Enums,
  NonNullableFields,
  Tables,
  Views,
} from '../_shared/typeUtils.ts';
import { indexBy } from '../_shared/indexBy.ts';

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
  const preuves = await fetchPreuves(
    supabaseClient,
    collectivite_id,
    referentiel
  );

  const getPreuvesParActionId = (action_id: string) =>
    preuves?.filter((p) => p.action?.action_id === action_id) || [];

  return {
    collectivite,
    actionsParId: indexBy(actions || [], 'action_id'),
    scores,
    auditeurs,
    commentairesParActionId: indexBy(commentaires || [], 'action_id'),
    getPreuvesParActionId,
  };
};

export type TExportData = Awaited<ReturnType<typeof fetchData>>;

/**
 * Charge les infos de la collectivité
 */

type Collectivite = {
  collectivite_id: number;
  nom: string;
  niveau_acces: Enums<'niveau_acces'> | null;
  acces_restreint: boolean;
  est_auditeur: boolean;
  // états dérivés
  isAdmin: boolean;
  readonly: boolean;
};
const fetchCollectivite = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number
) => {
  const { data, error } = await supabaseClient
    .from('collectivite_niveau_acces')
    .select()
    .match({ collectivite_id });

  if (error) {
    throw new Error(error.message);
  }

  const collectivite = data![0];
  if (!collectivite) return null;

  const { nom, niveau_acces, est_auditeur, access_restreint } = collectivite;

  return collectivite
    ? ({
        collectivite_id,
        nom,
        niveau_acces,
        isAdmin: niveau_acces === 'admin',
        est_auditeur,
        acces_restreint: access_restreint || false,
        readonly: niveau_acces === null || niveau_acces === 'lecture',
      } as Collectivite)
    : null;
};

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
 * Charge toutes les entrées d'un référentiel
 */
export type TActionReferentiel = NonNullableFields<Views<'action_statuts'>>;
const fetchActionsReferentiel = async (
  supabaseClient: TSupabaseClient,
  referentiel: Enums<'referentiel'>
) => {
  // la requête
  const { error, data } = await supabaseClient
    .from('action_referentiel')
    .select('action_id,identifiant,have_children,nom,depth,type,phase')
    .match({ referentiel })
    .gt('depth', 0);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as TActionReferentiel[];
};

/**
 * Charge les score avant/pendant audit
 */
type TScoreAudit = Tables<'type_tabular_score'>;
export type TComparaisonScoreAudit = Views<'comparaison_scores_audit'> & {
  action_id: string;
  pre_audit: TScoreAudit;
  courant: TScoreAudit;
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
 * Charge les commentaires de la collectivité associés aux actions
 */
const fetchCommentaires = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number,
  referentiel: Enums<'referentiel'>
) => {
  const { data, error } = await supabaseClient
    .from('action_commentaire')
    .select()
    .match({ collectivite_id })
    .ilike('action_id', `${referentiel}%`);

  if (error) {
    throw new Error(error.message);
  }

  return data;
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

  return (data[0].noms as TAuditeur[]) || [];
};

/**
 * Charge les preuves associées aux actions
 */
export type TPreuve = Views<'preuve'> & {
  action: null | { action_id: string };
  fichier: null | { filename: string };
  lien: null | { titre: string; url: string };
};
const fetchPreuves = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number,
  referentiel: Enums<'referentiel'>
) => {
  // lit la liste des preuves de la collectivité
  const query = supabaseClient
    .from('preuve')
    .select('*')
    .order('lien->>titre' as 'lien', { ascending: true })
    .order('fichier->>filename' as 'fichier', { ascending: true })
    .eq('collectivite_id', collectivite_id)
    .eq('action->>referentiel' as 'action', referentiel)
    .in('preuve_type', ['reglementaire', 'complementaire']);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as TPreuve[]) || [];
};
