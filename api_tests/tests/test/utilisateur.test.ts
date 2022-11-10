import {
  assertEquals,
  assertExists,
  assertMatch,
  assertObjectMatch,
} from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { supabase } from "../../lib/supabase.ts";
import { MesCollectivites } from "../../lib/types/mesCollectivites.ts";
import { signOut } from "../../lib/auth.ts";
import { testAddRandomUser } from "../../lib/rpcs/testAddRandomUser.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";

Deno.test("Creation d'un utilisateur pour une collectivité", async () => {
  await testReset();

  // On crée un utilisateur random, pour la collectivité 10.
  const user = await testAddRandomUser(10, "lecture");
  assertExists(user);
  assertMatch(user.prenom, /Y.+l.+/);
  assertMatch(user.nom, /D.+d.+/);

  // On se connecte avec ses credentials.
  const signInResponse = await supabase.auth.signIn(
    { email: user.email, password: user.password },
  );
  assertExists(signInResponse.user);
  assertEquals(
    signInResponse.user.role,
    "authenticated",
    "L'utilisateur devrait être authentifié.",
  );
  assertEquals(signInResponse.user.email, user.email);

  // On récupère sa liste de collectivité.
  const mesCollectivitesResponse = await supabase
    .from<MesCollectivites>("mes_collectivites")
    .select();
  const collectivites = mesCollectivitesResponse.data;
  assertExists(collectivites);
  assertEquals(
    collectivites.length,
    1,
    "L'utilisateur ne devrait avoir qu'une seule collectivité.",
  );
  assertObjectMatch(collectivites[0], {
    collectivite_id: 10,
    niveau_acces: "lecture",
    est_auditeur: false,
  });

  await signOut();
});
