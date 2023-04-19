import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function testFullfill(
  collectivite_id: number,
  etoile: Database["labellisation"]["Enums"]["etoile"],
): Promise<void> {
  const { error } = await supabase
    .rpc("test_fulfill", { collectivite_id, etoile })
    .single();
  if (error) {
    console.error(error);
    throw `La RPC 'test_fulfill' ne devrait pas renvoyer d'erreur.`;
  }

  return;
}
