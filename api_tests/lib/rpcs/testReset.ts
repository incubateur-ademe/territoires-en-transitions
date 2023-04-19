import { supabase } from "../supabase.ts";
import { delay } from "https://deno.land/std@0.163.0/async/delay.ts";

export async function testReset(): Promise<void> {
  const { status, error } = await supabase.rpc("test_reset");

  if (error) {
    console.error(error);
    throw `La RPC 'test_reset' devrait renvoyer un code 20x. (${status})`;
  }

  // Évite les deadlock
  await delay(100);
}
