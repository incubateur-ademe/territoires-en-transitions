import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function labellisationDemande(
  collectivite_id: number,
  referentiel: Database["public"]["Enums"]["referentiel"],
): Promise<Database["labellisation"]["Tables"]["demande"]["Row"]> {
  const { data } = await supabase
    .rpc("labellisation_demande", { collectivite_id, referentiel })
    .single();
  if (!data) {
    throw `La RPC 'labellisation_demande' devrait renvoyer une demande d'audit.`;
  }

  // @ts-ignore
  return data;
}
