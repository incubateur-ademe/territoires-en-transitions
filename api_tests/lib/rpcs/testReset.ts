import { supabase } from "../supabase.ts";

export async function testReset(): Promise<void> {
  const { status, error } = await supabase.rpc("test_reset");
  if (status !== 200) {
    console.error(error);
    throw `La RPC 'test_reset' devrait renvoyer un code 200. (${status} != 200)`;
  }
}
