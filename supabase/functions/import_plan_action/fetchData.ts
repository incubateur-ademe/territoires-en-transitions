import { Database, TablesInsert } from "../_shared/database.types.ts";
import { TSupabaseClient } from "../_shared/getSupabaseClient.ts";
import { TFicheResume, TIndicateur, TPersonneMemoire } from "./types.ts";

/**
 * Récupère des données utiles au nettoyage du fichier excel
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return des données utiles au nettoyage du fichier excel
 */
export const fetchData = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number
) => {
  return {
    collectivite_id: collectivite_id,
    // - Thématiques
    thematiques: await fetchThematiques(supabaseClient),
    // - Sous thématiques
    sousThematiques: await fetchSousThematiques(supabaseClient),
    // - Indicateurs
    indicateurs: await fetchIndicateurs(supabaseClient, collectivite_id),
    // - Actions
    actions: await fetchActions(supabaseClient),
    // - Personnes
    personnes: await fetchPersonnes(supabaseClient, collectivite_id),
    // - Fiches
    fiches: await fetchFiches(supabaseClient, collectivite_id),
  };
};
export type TMemoire = Awaited<ReturnType<typeof fetchData>>;

/**
 * Récupère les thématiques
 * @param supabaseClient client supabase
 * @return map <nom de la thématique, objet de la thématique>
 */
export const fetchThematiques = async (
  supabaseClient: TSupabaseClient
): Promise<
  Map<string, Database["public"]["Tables"]["thematique"]["Insert"]>
> => {
  const query = supabaseClient.from("thematique").select();

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const toReturn = new Map<
    string,
    Database["public"]["Tables"]["thematique"]["Insert"]
  >();
  for (let i = 0; i < data.length; i++) {
    const thematique: TablesInsert<"thematique"> = data[i];
    toReturn.set(thematique.nom, thematique);
  }
  return toReturn;
};

/**
 * Récupère les sous-thématiques
 * @param supabaseClient client supabase
 * @return map <nom de la sous-thématique, objet de la sous-thématique>
 */
export const fetchSousThematiques = async (
  supabaseClient: TSupabaseClient
): Promise<
  Map<string, Database["public"]["Tables"]["sous_thematique"]["Insert"]>
> => {
  const query = supabaseClient.from("sous_thematique").select();

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const toReturn = new Map<
    string,
    Database["public"]["Tables"]["sous_thematique"]["Insert"]
  >();
  for (let i = 0; i < data.length; i++) {
    const sousThematique: Database["public"]["Tables"]["sous_thematique"]["Insert"] =
      data[i];
    toReturn.set(sousThematique.sous_thematique, sousThematique);
  }
  return toReturn;
};

/**
 * Récupère les indicateurs de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <identifiant (référentiel) ou nom (personnalisé) de l'indicateur, objet de l'indicateur>
 */
export const fetchIndicateurs = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number
): Promise<Map<string, TIndicateur>> => {
  const query = supabaseClient
    .from("indicateur_definition")
    .select()
    .eq("collectivite_id", collectivite_id);

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const toReturn = new Map<string, TIndicateur>();
  for (let i = 0; i < data.length; i++) {
    const indicateur: TIndicateur = data[i];
    toReturn.set(
      indicateur.identifiant_referentiel ?? indicateur.titre,
      indicateur
    );
  }
  return toReturn;
};

/**
 * Récupère les actions
 * @param supabaseClient client supabase
 * @return map <identifiant de l'action, objet de l'action>
 */
export const fetchActions = async (
  supabaseClient: TSupabaseClient
): Promise<
  Map<string, Database["public"]["Tables"]["action_relation"]["Insert"]>
> => {
  const query = supabaseClient.from("action_relation").select();

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const toReturn = new Map<
    string,
    Database["public"]["Tables"]["action_relation"]["Insert"]
  >();
  for (let i = 0; i < data.length; i++) {
    const action: Database["public"]["Tables"]["action_relation"]["Insert"] =
      data[i];
    toReturn.set(action.id, action);
  }
  return toReturn;
};

/**
 * Récupère les personnes de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <nom de la personne, objet de la personne>
 */
export const fetchPersonnes = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number
): Promise<Map<string, TPersonneMemoire>> => {
  const query = supabaseClient.rpc("personnes_collectivite", {
    collectivite_id,
  });

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const toReturn = new Map<string, TPersonneMemoire>();
  for (let i = 0; i < data.length; i++) {
    const personne: TPersonneMemoire = {
      user: data[i]["user_id"],
      nom: data[i]["nom"],
    };
    if (data[i]["tag_id"] != null) {
      personne.tag = {
        id: data[i]["tag_id"],
        collectivite_id: data[i]["collectivite_id"],
        nom: data[i]["nom"],
      };
    }
    toReturn.set(personne.nom ?? "", personne);
  }
  return toReturn;
};

/**
 * Récupère les fiches de la collectivité
 * @param supabaseClient client supabase
 * @param collectivite_id identifiant de la collectivité
 * @return map <titre de la fiche, objet de la fiche>
 */
export const fetchFiches = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number
): Promise<Map<string, TFicheResume>> => {
  const query = supabaseClient
    .from("fiche_resume")
    .select()
    .eq("collectivite_id", collectivite_id);

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const toReturn = new Map<string, TFicheResume>();
  for (let i = 0; i < data.length; i++) {
    const fiche: TFicheResume = data[i];
    toReturn.set(fiche.titre ?? "", fiche);
  }
  return toReturn;
};
