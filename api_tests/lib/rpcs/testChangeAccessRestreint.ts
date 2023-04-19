import { supabase } from "../supabase.ts";

export async function testChangeAccessRestreint(
  collectiviteId: number,
  access_restreint: boolean,
): Promise<void> {
  const { status, error } = await supabase.rpc(
    "test_changer_acces_restreint_collectivite",
    { collectivite_id: collectiviteId, access_restreint: access_restreint },
  );
  if (error) {
    console.log(error);
    throw `La RPC 'test_changer_acces_restreint_collectivite' devrait renvoyer un code 20x. (${status})`;
  }
}
