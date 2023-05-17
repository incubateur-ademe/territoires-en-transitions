import {
  assertEquals,
  assertExists,
  assertFalse
} from "https://deno.land/std/testing/asserts.ts";
import { runConfidentialiteTest } from "../../lib/rpcs/confidentialite.ts";
import {supabase} from "../../lib/supabase.ts";
import {testReset} from "../../lib/rpcs/testReset.ts";
import {signIn, signOut} from "../../lib/auth.ts";
import {testAddRandomUser} from "../../lib/rpcs/testAddRandomUser.ts";

Deno.test("Test ", async () => {
  assertFalse(!await runConfidentialiteTest(null, null, null));
});
