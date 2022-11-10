import {
  assertEquals,
  assertNotEquals,
  assertObjectMatch,
} from "https://deno.land/std/testing/asserts.ts";
import { delay } from "https://deno.land/std@0.163.0/async/delay.ts";
import { supabase } from "../../lib/supabase.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { ActionScore, ClientScores } from "../../lib/types/clientScores.ts";
import { ActionStatut } from "../../lib/types/actionStatut.ts";
import { Avancement } from "../../lib/types/avancement.ts";

function scoreById(clientScores: ClientScores, actionId: string): ActionScore {
  return clientScores.scores.filter((s: ActionScore) =>
    s.action_id === actionId
  )[0]!;
}

Deno.test("Calcul des scores après insertion des statuts", async () => {
  await signIn("yolododo");

  const statut = {
    concerne: true,
    avancement: "programme" as Avancement,
    action_id: "eci_1.1.1.2",
    collectivite_id: 2,
  };
  const insert = await supabase.from<ActionStatut>("action_statut").upsert(
    statut,
  );

  // le statut inséré correspond au statut envoyé
  assertEquals(insert.data!.length, 1);
  assertObjectMatch(insert.data![0], statut);

  // on attend le calcul des scores
  await delay(200);
  const clientScores1 = await supabase.from<ClientScores>("client_scores")
    .select()
    .eq("collectivite_id", 2)
    .eq("referentiel", "eci");

  const actionScores1 = scoreById(clientScores1.data![0], "eci_1.1.1.2");
  // Avec le statut 'programme' :
  // - les 'fait' est à 0.
  // - le 'programme' est égal au potentiel.
  assertEquals(actionScores1.point_fait, 0);
  assertNotEquals(actionScores1.point_programme, 0);
  assertEquals(actionScores1.point_programme, actionScores1.point_potentiel);

  // on change le statut une seconde fois
  statut.avancement = "fait" as Avancement;
  await supabase.from("action_statut").upsert(statut);

  // on attend de nouveau le calcul des scores
  await delay(200);
  const clientScores2 = await supabase.from<ClientScores>("client_scores")
    .select()
    .eq("collectivite_id", 2)
    .eq("referentiel", "eci");

  const actionScores2 = scoreById(clientScores2.data![0], "eci_1.1.1.2");
  // Avec le statut 'fait' :
  // - le 'pas_fait' et le 'programme' sont à 0.
  // - le 'fait' est égal au potentiel.
  assertEquals(actionScores2.point_pas_fait, 0);
  assertEquals(actionScores2.point_programme, 0);
  assertNotEquals(actionScores2.point_fait, 0);
  assertEquals(actionScores2.point_fait, actionScores2.point_potentiel);

  // on se déconnecte pour libérer les ressources
  await signOut();
});
