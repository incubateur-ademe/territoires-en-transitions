import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { delay } from "https://deno.land/std@0.163.0/async/delay.ts";
import { supabase } from "../../lib/supabase.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { ClientScores } from "../../lib/types/clientScores.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import { saveReponse } from "../../lib/rpcs/saveReponse.ts";
import { scoreById } from "./scoreById.ts";

Deno.test("Calcul de 'eci_2.4.2' après la réponse à la question 'dechets_1'", async (t) => {
  await testReset();
  await signIn("yolododo");

  const reponse = {
    collectivite_id: 2,
    question_id: "dechets_1",
    reponse: false,
  };
  await saveReponse(reponse);

  // on attend le calcul des scores
  await delay(200);
  let clientScores = await supabase.from<ClientScores>("client_scores")
    .select()
    .eq("collectivite_id", 2)
    .eq("referentiel", "eci");

  const eci242_1 = scoreById(clientScores.data![0], "eci_2.4.2");
  assertEquals(
    eci242_1.desactive,
    true,
    "Sans la compétence 'dechet_1' l'action devrait être désactivée",
  );

  // on change notre réponse
  reponse.reponse = true;
  await saveReponse(reponse);

  // on attend de nouveau le calcul des scores
  await delay(200);
  clientScores = await supabase.from<ClientScores>("client_scores")
    .select()
    .eq("collectivite_id", 2)
    .eq("referentiel", "eci");

  const eci242_2 = scoreById(clientScores.data![0], "eci_2.4.2");
  assertEquals(
    eci242_2.desactive,
    false,
    "Avec la compétence 'dechet_1' l'action ne devrait pas être désactivée",
  );

  // on se déconnecte pour libérer les ressources
  await signOut();
});
