import { supabase } from "/lib/supabase.ts";
import { signIn, signOut } from "/lib/auth.ts";
import { testReset } from "/lib/rpcs/testReset.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.113.0/testing/asserts.ts";

Deno.test("Fiches par axe", async () => {
  await testReset();
  await signIn("yolododo");

  // les fiches de l'axe "Développer une culture vélo" qui compte des sous axes avec des fiches
  const filterResponse = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    axes_id: [16],
  });
  assertExists(filterResponse.data);
  assertEquals(filterResponse.data.length, 6);

  await signOut();
});

Deno.test("Fiches par pilote", async () => {
  await testReset();
  await signIn("yolododo");

  // une des fiches de l'axe "Développer une culture vélo"
  const selectPermisVelo = await supabase
    .from("fiches_action")
    .select()
    .eq("id", 7);
  assertExists(selectPermisVelo.data);

  // On ajoute un pilote à la fiche en l'insérant dans la vue.
  const permisVelo = selectPermisVelo.data[0];
  permisVelo.pilotes = [
    // @ts-ignore
    { nom: "Lou Piote", collectivite_id: 1, tag_id: 1, user_id: null },
  ];
  const insert = await supabase
    .from("fiches_action")
    .insert(permisVelo as never)
    .select();
  assertExists(insert.data);
  assertEquals(insert.status, 201);

  // on filtre avec l'axe et le tag pilote.
  const filterResponse = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    axes_id: [16],
    // @ts-ignore()
    pilotes: permisVelo.pilotes,
  });
  assertExists(filterResponse.data);
  assertEquals(filterResponse.data.length, 1);

  await signOut();
});
