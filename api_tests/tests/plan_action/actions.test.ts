import { supabase } from "/lib/supabase.ts";
import { signIn, signOut } from "/lib/auth.ts";
import { testReset } from "/lib/rpcs/testReset.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.113.0/testing/asserts.ts";

Deno.test("Fiches resume par fiche_action_action", async () => {
  await testReset();
  await signIn("yolododo");

  // les fiches de l'axe "Développer une culture vélo" qui compte des sous axes avec des fiches
  const response = await supabase
    .from("fiche_action_action")
    .select("*, fiche_resume(*)")
    .eq("fiche_resume.collectivite_id", 1)
    .like("action_id", "eci_2%");

  console.log(response);

  await signOut();
});
