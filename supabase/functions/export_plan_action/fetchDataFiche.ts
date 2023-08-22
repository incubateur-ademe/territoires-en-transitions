import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { TFicheActionExport, TFichier, TLien } from './types.ts';
import { fetchActionLabels } from './fetchData.ts';

/** charge les données nécessaires à l'export d'une seule */
export const fetchDataFiche = async (
  supabaseClient: TSupabaseClient,
  fiche_id: number
) => {
  const fiche = await fetchFicheAction(supabaseClient, fiche_id);
  const actionLabels = await getFicheActionLabels(supabaseClient, fiche);

  return {
    fiche,
    actionLabels,
    annexes: await fetchAnnexesFicheAction(supabaseClient, fiche_id),
  };
};

export type TExportData = Awaited<ReturnType<typeof fetchData>>;

// charge et formate pour l'export les libellés des actions liées
const getFicheActionLabels = (
  supabaseClient: TSupabaseClient,
  fiche: TFicheActionExport
) => {
  const actions_ids = fiche?.actions
    ?.map((action) => action.id)
    .filter((s) => !!s) as string[];

  return fetchActionLabels(supabaseClient, actions_ids);
};

// charge les données du plan d'action
const fetchFicheAction = async (
  supabaseClient: TSupabaseClient,
  fiche_id: number
) => {
  const { data, error } = await supabaseClient
    .from('fiches_action')
    .select()
    .eq('id', fiche_id);

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] as unknown as TFicheActionExport;
};

// charge la liste des annexes associées à une fiche
const fetchAnnexesFicheAction = async (
  supabaseClient: TSupabaseClient,
  fiche_id: number
) => {
  const { data, error } = await supabaseClient
    .from('bibliotheque_annexe')
    .select()
    .eq('fiche_id', fiche_id)
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
