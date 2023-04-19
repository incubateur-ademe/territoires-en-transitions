import { supabase } from "../supabase.ts";
import * as retry from "https://deno.land/x/retry@v2.0.0/mod.ts";

async function _testReset(): Promise<void> {
  const { status, error } = await supabase.rpc("test_reset");

  if (error) {
    console.error(error);
    throw `La RPC 'test_reset' devrait renvoyer un code 20x. (${status})`;
  }
}

export const testReset = retry.retryAsyncDecorator(_testReset, {
  delay: 100,
  maxTry: 5,
});
