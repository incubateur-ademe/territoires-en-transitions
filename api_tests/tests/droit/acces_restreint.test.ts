import {
  assertEquals,
  assertExists,
} from "https://deno.land/std/testing/asserts.ts";
import { supabase } from "../../lib/supabase.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import { testChangeAccessRestreint } from "../../lib/rpcs/testChangeAccessRestreint.ts";

const dirtyOptions = {
  sanitizeResources: false,
  sanitizeOps: false,
};

await new Promise((r) => setTimeout(r, 0));
// fiche_action
Deno.test("Test accès fiche_action", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiches_action
Deno.test("Test accès fiches_action", dirtyOptions, async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Teste que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiches_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(
    true,
    result1.data.length > 0,
    "Yolododo, qui appartient à la collectivite 1, a accès aux données de la collectivité 1",
  );
  await signOut();

  // Teste que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiches_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(
    true,
    result2.data.length > 0,
    "Yulududu, qui n'appartient pas à la collectivite 1, a accès aux données de la collectivité 1",
  );
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiches_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(
    true,
    result3.data.length > 0,
    "Yolododo, qui appartient à la collectivite 1, a toujours accès aux données de la collectivité 1",
  );
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiches_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(
    true,
    result4.data.length == 0,
    "Yulududu, qui n'appartient pas à la collectivite 1, n'a plus accès aux données de la collectivité 1",
  );
  await signOut();
});

// axe
Deno.test("Test accès axes", dirtyOptions, async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase.from("axe").select().eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase.from("axe").select().eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase.from("axe").select().eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase.from("axe").select().eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_axe
Deno.test("Test accès fiche_action_axe", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_axe")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_axe")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_axe")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_axe")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// financeur_tag
Deno.test("Test accès financeur_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("financeur_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("financeur_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("financeur_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("financeur_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_financeur_tag
Deno.test("Test accès fiche_action_financeur_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_financeur_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_financeur_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_financeur_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_financeur_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// service_tag
Deno.test("Test accès service_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("service_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("service_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("service_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("service_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_service_tag
Deno.test("Test accès fiche_action_service_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_service_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_service_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_service_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_service_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// partenaire_tag
Deno.test("Test accès partenaire_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("partenaire_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("partenaire_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("partenaire_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("partenaire_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_partenaire_tag
Deno.test("Test accès fiche_action_partenaire_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_partenaire_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_partenaire_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_partenaire_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_partenaire_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// personne_tag
Deno.test("Test accès personne_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("personne_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("personne_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("personne_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("personne_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_pilote
Deno.test("Test accès fiche_action_pilote", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_pilote")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_pilote")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_pilote")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_pilote")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_referent
Deno.test("Test accès fiche_action_referent", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_referent")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_referent")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_referent")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_referent")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_thematique
Deno.test("Test accès fiche_action_thematique", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_sous_thematique
Deno.test("Test accès fiche_action_sous_thematique", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_sous_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_sous_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_sous_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_sous_thematique")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// structure_tag
Deno.test("Test accès structure_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("structure_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("structure_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("structure_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("structure_tag")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// fiche_action_structure_tag
Deno.test("Test accès fiche_action_structure_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_structure_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_structure_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_structure_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_structure_tag")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// annexe
Deno.test("Test accès annexe", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("annexe")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  // TODO pas d'annexe dans les données de test assertEquals(true, result1.data.length>0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("annexe")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  // TODO pas d'annexe dans les données de test assertEquals(true, result2.data.length>0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("annexe")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  // TODO pas d'annexe dans les données de test assertEquals(true, result3.data.length>0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("annexe")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  // TODO pas d'annexe dans les données de test assertEquals(true, result4.data.length==0);
  await signOut();
});

// fiche_action_indicateur
Deno.test("Test accès fiche_action_indicateur", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_indicateur")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  // TODO pas d'indicateur dans les données de test assertEquals(true, result1.data.length>0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_indicateur")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  // TODO pas d'indicateur dans les données de test assertEquals(true, result2.data.length>0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_indicateur")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  // TODO pas d'indicateur dans les données de test assertEquals(true, result3.data.length>0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_indicateur")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  // TODO pas d'indicateur dans les données de test assertEquals(true, result4.data.length==0);
  await signOut();
});

// fiche_action_action
Deno.test("Test accès financeur_tag", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("fiche_action_action")
    .select()
    .eq("fiche_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("fiche_action_action")
    .select()
    .eq("fiche_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("fiche_action_action")
    .select()
    .eq("fiche_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("fiche_action_action")
    .select()
    .eq("fiche_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// indicateur_resultat
Deno.test("Test accès indicateur_resultat", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("indicateur_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("indicateur_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("indicateur_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("indicateur_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// indicateur_objectif
Deno.test("Test accès indicateur_objectif", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("indicateur_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("indicateur_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("indicateur_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("indicateur_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// indicateur_resultat_commentaire
Deno.test("Test accès indicateur_resultat_commentaire", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("indicateur_resultat_commentaire")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("indicateur_resultat_commentaire")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("indicateur_resultat_commentaire")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("indicateur_resultat_commentaire")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// indicateur_personnalise_definition
Deno.test("Test accès indicateur_personnalise_definition", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("indicateur_personnalise_definition")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("indicateur_personnalise_definition")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("indicateur_personnalise_definition")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("indicateur_personnalise_definition")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// indicateur_personnalise_resultat
Deno.test("Test accès indicateur_personnalise_resultat", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("indicateur_personnalise_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("indicateur_personnalise_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("indicateur_personnalise_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("indicateur_personnalise_resultat")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// indicateur_personnalise_objectif
Deno.test("Test accès indicateur_personnalise_objectif", async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("indicateur_personnalise_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("indicateur_personnalise_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("indicateur_personnalise_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("indicateur_personnalise_objectif")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

// plan_action
Deno.test("Test accès plan_action", dirtyOptions, async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("plan_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("plan_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("plan_action")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
      .from("plan_action")
      .select()
      .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length==0);
  await signOut();
});

// plan_action_profondeur
Deno.test("Test accès plan_action_profondeur", dirtyOptions, async () => {
  await testReset();
  // Passe la collectivite 1 sans acces restreint
  await testChangeAccessRestreint(1, false);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yolododo");
  const result1 = await supabase
    .from("plan_action_profondeur")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la collectivité 1
  await signIn("yulududu");
  const result2 = await supabase
    .from("plan_action_profondeur")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la collectivite 1 en acces restreint
  await testChangeAccessRestreint(1, true);

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la collectivité 1
  await signIn("yolododo");
  const result3 = await supabase
    .from("plan_action_profondeur")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la collectivité 1
  await signIn("yulududu");
  const result4 = await supabase
    .from("plan_action_profondeur")
    .select()
    .eq("collectivite_id", 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length==0);
  await signOut();
});
