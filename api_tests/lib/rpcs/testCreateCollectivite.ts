import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function testCreateCollectivite(
  nom: string,
): Promise<Database["public"]["Tables"]["collectivite_test"]["Row"]> {
  const { data, error } = await supabase
    .rpc("test_create_collectivite", { nom })
    .single();
  if (!data || error) {
    console.error(error);
    throw `La RPC 'test_create_collectivite' devrait renvoyer une collectivité de test.`;
  }

  // @ts-ignore
  return data;
}
