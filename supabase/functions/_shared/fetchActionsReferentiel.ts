import { TSupabaseClient } from './getSupabaseClient.ts';
import { Enums, NonNullableFields, Views } from './typeUtils.ts';

export type TActionReferentiel = NonNullableFields<Views<'action_statuts'>>;

/**
 * Charge toutes les entrées d'un référentiel
 */
export const fetchActionsReferentiel = async (
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
 * Charge les commentaires de la collectivité associés aux actions d'un référentiel
 */
export const fetchCommentaires = async (
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
 * Charge les preuves associées aux actions d'un référentiel
 */
export type TPreuve = Views<'preuve'> & {
  action: null | { action_id: string };
  fichier: null | { filename: string };
  lien: null | { titre: string; url: string };
};
export const fetchPreuves = async (
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

  const preuves = (data as TPreuve[]) || [];

  const getPreuvesParActionId = (action_id: string) =>
    preuves?.filter((p) => p.action?.action_id === action_id) || [];

  return {
    preuves,
    getPreuvesParActionId,
  };
};

/** Renvoi l'id parent d'une action */
export const getActionParentId = (actionId: string) =>
  actionId.split('.').toSpliced(-1, 1).join('.');
