import {
  assertEquals,
  assertExists,
} from "https://deno.land/std/testing/asserts.ts";
import { supabase } from "/lib/supabase.ts";
import { signIn, signOut } from "/lib/auth.ts";
import { testReset } from "/lib/rpcs/testReset.ts";

Deno.test("Suppression d'une fiche", async () => {
  await testReset();
  await signIn("yolododo");

  // Une fiche dans les données de test
  const selectResponse1 = await supabase
    .from("fiches_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(selectResponse1.data);
  assertEquals(13, selectResponse1.data.length);

  const id = selectResponse1.data[0]["id"];
  assertExists(id);

  const deleteResponse = await supabase
    .from("fiche_action")
    .delete()
    .eq("id", id);
  assertEquals(204, deleteResponse.status);

  const selectResponse2 = await supabase
    .from("fiches_action")
    .select()
    .eq("collectivite_id", 2);
  assertExists(selectResponse2.data);
  assertEquals(0, selectResponse2.data.length);

  await signOut();
});

Deno.test("Vue personne pilote", async () => {
  await testReset();
  await signIn("yolododo");

  // Une fiche dans les données de test
  const selectResponse1 = await supabase
    .from("fiche_action_personne_pilote")
    .select()
    .eq("collectivite_id", 1);
  assertExists(selectResponse1.data);
  assertEquals(6, selectResponse1.data.length);

  await signOut();
});

Deno.test("Vue personne référente", async () => {
  await testReset();
  await signIn("yolododo");

  // Une fiche dans les données de test
  const selectResponse1 = await supabase
    .from("fiche_action_personne_referente")
    .select()
    .eq("collectivite_id", 1);
  assertExists(selectResponse1.data);
  assertEquals(6, selectResponse1.data.length);

  await signOut();
});

Deno.test("Plan d'action", async () => {
  await testReset();
  await signIn("yolododo");

  // Une fiche dans les données de test
  const selectResponse1 = await supabase.rpc("plan_action", { id: 1 });
  assertExists(selectResponse1.data);
  console.log(selectResponse1);

  await signOut();
});
Deno.test("Plan d'actions d'une collectivité", async () => {
  await testReset();
  await signIn("yolododo");

  // La liste des axes sans parents qui sont donc des plans.
  const selectResponse1 = await supabase
    .from("axe")
    .select()
    .eq("collectivite_id", 1)
    .is("parent", null);
  assertExists(selectResponse1.data);
  console.log(selectResponse1);

  await signOut();
});
Deno.test("Supprimer un axe et ses élements", async () => {
  await testReset();
  await signIn("yolododo");

  // Supprimer
  await supabase.rpc("delete_axe_all", { axe_id: 1 });
  const deletedAxe = await supabase.from("axe").select().eq("id", 9);
  assertEquals(deletedAxe.data!.length, 0);

  await signOut();
});
