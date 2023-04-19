import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function testMaxFullfill(
  collectivite_id: number,
  referentiel: Database["public"]["Enums"]["referentiel"],
): Promise<void> {
  const { error } = await supabase.rpc("test_max_fulfill", {
    collectivite_id,
    referentiel,
  });
  if (error) {
    console.error(error);
    throw `La RPC 'test_max_fulfill' ne devrait pas renvoyer d'erreur.`;
  }

  return;
}
