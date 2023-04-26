import { supabase } from "/lib/supabase.ts";
import { signIn, signOut } from "/lib/auth.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.113.0/testing/asserts.ts";

Deno.test("Tableau de bord plan action", async () => {
  await signIn("yolododo");

  type TPlanActionTableauDeBord = {
    collectivite_id: number;
    plan_id: number;
    pilotes: { id: string; value: number }[];
    priorites: { id: string; value: number }[];
    referents: { id: string; value: number }[];
    statuts: { id: string; value: number }[];
  };

  // Appel fonction pour toutes les fiches de la collectivité 1
  const reponse = await supabase
    .rpc("plan_action_tableau_de_bord", {
      collectivite_id: 1,
      sans_plan: false,
      // @ts-ignore
      plan_id: null,
    })
    .select();
  const tdb = reponse.data as unknown as TPlanActionTableauDeBord;
  assertExists(tdb);
  const pilotes = tdb.pilotes;
  assertExists(pilotes);
  assertEquals(pilotes.length, 4);

  // Appel fonction pour toutes les fiches du plan 12 de la collectivité 1
  const reponse2 = await supabase
    .rpc("plan_action_tableau_de_bord", {
      collectivite_id: 1,
      sans_plan: false,
      plan_id: 12,
    })
    .select();
  const tdb2 = reponse2.data as unknown as TPlanActionTableauDeBord;
  assertExists(tdb2);
  const pilotes2 = tdb2.pilotes;
  assertExists(pilotes2);
  assertEquals(pilotes2.length, 1);

  // Appel fonction pour toutes les fiches non classées de la collectivité 1
  const reponse3 = await supabase
    .rpc("plan_action_tableau_de_bord", {
      collectivite_id: 1,
      sans_plan: true,
      // @ts-ignore
      plan_id: null,
    })
    .select();
  const tdb3 = reponse3.data as unknown as TPlanActionTableauDeBord;
  assertExists(tdb3);
  const pilotes3 = tdb3.pilotes;
  assertExists(pilotes3);
  assertEquals(pilotes3.length, 1);

  console.log(pilotes2);

  await signOut();
});
