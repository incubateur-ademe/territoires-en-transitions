import { supabase } from "../../lib/supabase.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
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
  assertEquals(filterResponse.data.length, 3);

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

Deno.test("Fiches par echeance", async () => {
  await testReset();
  await signIn("yolododo");

  await supabase
    .from("fiche_action")
    .update({ amelioration_continue: true })
    .eq("id", 1)
    .select();

  const filterResponse = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    echeance: "Action en amélioration continue",
  });
  assertExists(filterResponse.data);
  assertEquals(filterResponse.data.length, 1);

  await signOut();

  await testReset();
  await signIn("yolododo");

  await supabase
    .from("fiche_action")
    .update({ date_fin_provisoire: new Date().toISOString() })
    .eq("id", 1)
    .select();

  const filterResponse2 = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    echeance: "Échéance dépassée",
  });
  assertExists(filterResponse2.data);
  assertEquals(filterResponse2.data.length, 1);

  const filterResponse3 = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    echeance: "Échéance dans plus d’un an",
  });
  assertExists(filterResponse3.data);
  assertEquals(filterResponse3.data.length, 0);

  await signOut();
});

Deno.test("Fiches par budget", async () => {
  await testReset();
  await signIn("yolododo");

  await supabase
    .from("fiche_action")
    .update({ budget_previsionnel: 10 })
    .eq("id", 1)
    .select();

  const filterResponse = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    budget_min: 8,
  });
  assertExists(filterResponse.data);
  assertEquals(filterResponse.data.length, 1);

  const filterResponse2 = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    budget_min: 8,
    budget_max: 9,
  });
  assertExists(filterResponse2.data);
  assertEquals(filterResponse2.data.length, 0);

  await signOut();
});

Deno.test("Fiches par thematique", async () => {
  await testReset();
  await signIn("yolododo");

  const filterResponse = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    thematiques: [{ thematique: "Activités économiques" }],
  });
  assertExists(filterResponse.data);
  assertEquals(filterResponse.data.length, 10);

  const filterResponse2 = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    thematiques: [{ thematique: "Énergie et climat" }],
  });
  assertExists(filterResponse2.data);
  assertEquals(filterResponse2.data.length, 0);

  const filterResponse3 = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    sous_thematiques: [
      {
        id: 1,
        thematique: "Activités économiques",
        sous_thematique: "Agriculture et alimentation",
      },
    ],
  });
  assertExists(filterResponse3.data);
  assertEquals(filterResponse3.data.length, 10);

  await signOut();
});

Deno.test("Fiches sans plan", async () => {
  await testReset();
  await signIn("yolododo");

  const filterResponse = await supabase.rpc("filter_fiches_action", {
    collectivite_id: 1,
    sans_plan: true,
  });
  assertExists(filterResponse.data);
  assertEquals(filterResponse.data.length, 1);

  await signOut();
});
