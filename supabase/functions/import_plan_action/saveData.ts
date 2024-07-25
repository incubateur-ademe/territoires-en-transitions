import { TSupabaseClient } from "../_shared/getSupabaseClient.ts";
import { TAxeImport, TFicheActionImport } from "./types.ts";
import { TMemoire } from "./fetchData.ts";
import { Database } from "../_shared/database.types.ts";

/**
 * Sauvegarde le plan d'action
 * @param supabaseClient client supabase
 * @param memoire données utiles au nettoyage du fichier
 * @param fiches fiches du plan à sauvegarder
 * @return ?
 */
export const saveData = async (
  supabaseClient: TSupabaseClient,
  memoire: TMemoire,
  fiches: TFicheActionImport[]
) => {
  let fiche: TFicheActionImport;
  for (fiche of fiches) {
    console.log("fiche", fiche.titre);
    const { axeImport, annexesImport, ...ficheToSave } = fiche;
    // Sauvegarde axe
    const axe: Database["public"]["Tables"]["axe"]["Insert"] = await saveAxes(
      supabaseClient,
      memoire,
      axeImport
    );
    ficheToSave.axes = axe == null ? null : [axe];
    // Sauvegarde fiche_action
    if (ficheToSave.titre != null) {
      const { error, data } = await supabaseClient
        .from("fiches_action")
        .upsert(ficheToSave);
      if (error) {
        throw new Error(error.message);
      }
      // TODO save annexe et lien avec fiche
    }
  }
  return "ok";
};

/**
 * Sauvegarde l'axe et ses axes parents de manière récursive
 * @param supabaseClient client supabase
 * @param memoire données utiles au nettoyage du fichier
 * @param axe axe à sauvegarder
 * @return axe sauvegardé
 */
const saveAxes = async (
  supabaseClient: TSupabaseClient,
  memoire: TMemoire,
  axe: TAxeImport | null
): Promise<Database["public"]["Tables"]["axe"]["Insert"]> => {
  if (!axe) {
    return null;
  }
  const parent = await saveAxes(supabaseClient, memoire, axe.parent);
  const axeToSave: Database["public"]["Tables"]["axe"]["Insert"] = {
    nom: axe.nom,
    collectivite_id: memoire.collectivite_id,
    parent: !parent ? null : parent.id,
  };
  const { error, data } = await supabaseClient.rpc("upsert_axe", axeToSave);
  if (error) {
    throw new Error(error.message);
  }
  axeToSave.id = data;
  return axeToSave;
};
