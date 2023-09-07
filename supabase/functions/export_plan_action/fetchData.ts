import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { TFicheActionExport, TFichier, TLien } from './types.ts';

/** charge les données nécessaires à l'export du plan complet */
export const fetchData = async (
  supabaseClient: TSupabaseClient,
  plan_id: number
) => {
  const plan = await fetchPlanAction(supabaseClient, plan_id);
  const actionLabels = await getActionLabels(supabaseClient, plan);

  return {
    plan,
    actionLabels,
    annexes: await fetchAnnexesPlanAction(supabaseClient, plan_id),
  };
};

export type TExportData = Awaited<ReturnType<typeof fetchData>>;

// charge et formate pour l'export les libellés des actions liées
const getActionLabels = (
  supabaseClient: TSupabaseClient,
  plan: TFicheActionExport[]
) => {
  const actions_ids = plan
    ?.flatMap(({ fiche: ficheObj }) => {
      const { fiche } = ficheObj || {};
      return fiche?.actions?.map((action) => action.id);
    })
    .filter((s) => !!s) as string[];

  return fetchActionLabels(supabaseClient, actions_ids);
};

// charge les données du plan d'action
const fetchPlanAction = async (
  supabaseClient: TSupabaseClient,
  plan_id: number
) => {
  const { data, error } = await supabaseClient.rpc('plan_action_export', {
    id: plan_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as TFicheActionExport[];
};

// charge la liste des annexes associées aux fiches d'un plan d'action
const fetchAnnexesPlanAction = async (
  supabaseClient: TSupabaseClient,
  plan_id: number
) => {
  const { data, error } = await supabaseClient
    .from('bibliotheque_annexe')
    .select()
    .overlaps('plan_ids', [plan_id])
    .order('lien->>titre' as 'lien', { ascending: true })
    .order('fichier->>filename' as 'fichier', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((a) => ({
    ...a,
    preuve_type: 'annexe',
    fichier: a.fichier as TFichier | null,
    lien: a.lien as TLien | null,
  }));
};

// charge les libellés des actions données
export const fetchActionLabels = async (
  supabaseClient: TSupabaseClient,
  action_ids?: string[]
) => {
  if (!action_ids?.length) return {};

  const query = supabaseClient
    .from('action_definition')
    .select('action_id,referentiel, nom, identifiant')
    .in('action_id', action_ids);

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return Object.fromEntries(
    data?.map((d) => [
      d.action_id,
      `${d.referentiel} ${d.identifiant} - ${d.nom}`,
    ]) || []
  );
};

export const getAnnexesLabels = (
  annexes: TExportData['annexes'],
  ficheId: number | null
) =>
  ficheId && annexes
    ? (annexes
        .filter((annexe) => annexe.fiche_id === ficheId)
        .map((annexe) => annexe?.lien?.url || annexe?.fichier?.filename || null)
        .filter((s) => !!s) as string[])
    : [];
