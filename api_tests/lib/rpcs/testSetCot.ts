import { supabase } from "../supabase.ts";
import { Database } from "../database.types.ts";

export async function testSetCot(
  collectivite_id: number,
  actif: boolean,
): Promise<Database["public"]["Tables"]["cot"]["Row"]> {
  const { data } = await supabase.rpc(
    "test_set_cot",
    { collectivite_id, actif },
  ).single();
  if (!data) {
    throw `La RPC 'test_set_cot' devrait renvoyer un COT.`;
  }

  // @ts-ignore
  return data;
}
