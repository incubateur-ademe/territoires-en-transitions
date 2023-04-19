import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { supabase } from "/lib/supabase.ts";
import { signIn, signOut } from "/lib/auth.ts";
import { testReset } from "/lib/rpcs/testReset.ts";
import { Database } from "/lib/database.types.ts";

Deno.test("Enregistre des usages", async (t) => {
  await testReset();
  const { data } = await signIn("yolododo");

  let clicAide = {
    collectivite_id: 1,
    fonction: "aide" as Database["public"]["Enums"]["usage_fonction"],
    action: "clic" as Database["public"]["Enums"]["usage_action"],
    page: "mes_collectivites" as Database["public"]["Enums"]["visite_page"],
  };
  let response = await supabase.from("usage").insert(clicAide);
  assertEquals(response.status, 201);

  let telechargementGraph = {
    collectivite_id: 1,
    fonction: "graphique" as Database["public"]["Enums"]["usage_fonction"],
    action: "telechargement" as Database["public"]["Enums"]["usage_action"],
    page: "tableau_de_bord" as Database["public"]["Enums"]["visite_page"],

    user_id: data!.user!.id,
  };
  response = await supabase.from("usage").insert(telechargementGraph);
  assertEquals(response.status, 201);

  // on se déconnecte pour libérer les ressources
  await signOut();
});
